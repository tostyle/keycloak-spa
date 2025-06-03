import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as OIDCStrategy } from "passport-openidconnect";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { UserProfile } from "./server/types"; // Adjust the import path as necessary
import marketingRoutes from "server/modules/marketing";
import { checkPermission, getPermissions } from "server/permission";

// Extend Express session to include passport
declare module "express-session" {
  interface SessionData {
    passport?: {
      user?: any;
    };
  }
}

dotenv.config();

const PORT = process.env.PORT || 4001;

const isProduction = process.env.NODE_ENV === "production";
// Middleware to check if user is authenticated
function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.log("Checking authentication for request:", req.originalUrl);
  console.log("Is user authenticated?", req.isAuthenticated());
  if (req.isAuthenticated()) {
    return next();
  }
  const user = req.user as UserProfile;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.status(401).json({ message: "Unauthorized" });
}

async function startServer(): Promise<Express> {
  const app = express();

  // Trust proxy when behind reverse proxy/load balancer
  // app.set("trust proxy", 1);

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    configFile: path.resolve(__dirname, "vite.config.ts"),
  });

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "fallback-secret-key",
      resave: false,
      saveUninitialized: false, // Changed to false to prevent unnecessary sessions
      name: "sessionId", // Custom session name
      cookie: {
        secure: isProduction && process.env.SECURE_COOKIES !== "false",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: isProduction ? "none" : "lax", // Allow cross-site cookies in production
      },
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration
  passport.use(
    "oidc",
    new OIDCStrategy(
      {
        issuer: process.env.OIDC_ISSUER || "",
        authorizationURL: process.env.OIDC_AUTHORIZE_URL || "",
        tokenURL: process.env.OIDC_TOKEN_URL || "",
        userInfoURL: process.env.OIDC_USERINFO_URL || "",
        clientID: process.env.OIDC_CLIENT_ID || "",
        clientSecret: process.env.OIDC_CLIENT_SECRET || "",
        callbackURL: process.env.OIDC_CALLBACK_URL || "",
        scope: ["openid", "profile", "email"],
        skipUserProfile: false, // Ensure we get user profile
        passReqToCallback: false,
      },
      (
        _issuer: string,
        profile: UserProfile,
        context: object,
        idToken: string | object,
        accessToken: string | object,
        refreshToken: string,
        done: Function
      ) => {
        console.log("OIDC Strategy called successfully");
        console.log(
          "Profile received:",
          profile.displayName || profile.username
        );
        console.log("OIDC accessToken:", typeof accessToken);
        console.log("OIDC refreshToken:", typeof refreshToken);
        console.log("OIDC idToken:", typeof idToken);

        profile.accessToken = accessToken as string;
        profile.idToken = idToken as string;
        profile.refreshToken = refreshToken;

        return done(null, profile);
      }
    )
  );

  // Serialize and deserialize user
  passport.serializeUser((user: UserProfile, done: Function) => {
    done(null, user);
  });

  passport.deserializeUser((user: UserProfile, done: Function) => {
    done(null, user);
  });

  // Routes

  // Debug route to check session and auth state
  app.get("/auth/debug", (req: Request, res: Response) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      user: req.user ? "User exists" : "No user",
      session: {
        passport: req.session.passport
          ? "Passport session exists"
          : "No passport session",
      },
    });
  });

  // Login route with error handling
  app.get("/auth/login", (req: Request, res: Response, next: NextFunction) => {
    console.log("Login attempt, session ID:", req.sessionID);
    console.log("Is already authenticated:", req.isAuthenticated());

    if (req.isAuthenticated()) {
      console.log("User already authenticated, redirecting to /admin");
      return res.redirect("/admin");
    }

    passport.authenticate("oidc", {
      scope: ["openid", "profile", "email"],
    })(req, res, next);
  });

  // Callback route with better error handling
  app.get(
    "/auth/callback",
    (req: Request, res: Response, next: NextFunction) => {
      console.log("Auth callback received, session ID:", req.sessionID);
      console.log("Query params:", req.query);

      passport.authenticate("oidc", (err: any, user: any, info: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.redirect("/auth/login?error=auth_failed");
        }

        if (!user) {
          console.error("No user returned from authentication:", info);
          return res.redirect("/auth/login?error=no_user");
        }

        req.logIn(user, (loginErr: any) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res.redirect("/auth/login?error=login_failed");
          }

          console.log(
            "User successfully authenticated:",
            user.displayName || user.username
          );
          return res.redirect("/admin");
        });
      })(req, res, next);
    }
  );

  // Profile route (protected)
  app.get("/profile", isAuthenticated, (req: Request, res: Response) => {
    console.log("User profile:", req.user);
    res.json({
      user: req.user,
    });
  });
  app.get("/permissions", isAuthenticated, getPermissions);
  app.get("/permissions/:resource/:scope", isAuthenticated, checkPermission);

  // Token route - to easily access tokens for frontend use
  app.get("/api/tokens", isAuthenticated, (req: Request, res: Response) => {
    if (req.user) {
      const user = req.user as UserProfile;
      const { accessToken, idToken, refreshToken } = user;
      res.json({
        accessToken,
        tokenType: "Bearer",
        // Optionally include other tokens if needed
        // id_token,
        // refresh_token
      });
    } else {
      res.status(401).json({ message: "No authentication tokens available" });
    }
  });

  // Logout route
  app.get("/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    const logoutUrl = process.env.OIDC_LOGOUT_URL;
    const redirectUri = process.env.OIDC_LOGOUT_REDIRECT_URI;

    const user = req.user as UserProfile;
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }

      // Destroy session
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destroy error:", sessionErr);
        }

        // Redirect to Keycloak logout if configured
        if (logoutUrl && redirectUri) {
          const keycloakLogoutUrl = `${logoutUrl}?post_logout_redirect_uri=${encodeURIComponent(
            redirectUri
          )}&id_token_hint=${user?.idToken}`;
          res.redirect(keycloakLogoutUrl);
        } else {
          res.redirect("/");
        }
      });
    });
  });

  // Logout callback route for Keycloak
  app.get("/auth/logout/callback", (req: Request, res: Response) => {
    console.log("Logout callback received");
    res.redirect("/");
  });

  // Health check endpoints for Kubernetes probes
  app.get("/health", (req: Request, res: Response) => {
    // Liveness probe - check if the application is running
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get("/ready", (req: Request, res: Response) => {
    // Readiness probe - check if the application is ready to serve traffic
    // You can add more sophisticated checks here (database connectivity, etc.)
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
      checks: {
        server: "ok",
        // Add more checks as needed
      },
    });
  });

  app.use("/marketing", marketingRoutes);

  // Create Vite server in middleware mode

  // Use vite's connect instance as middleware
  if (!isProduction) {
    console.log("Using Vite middleware in development mode");
    app.use(vite.middlewares);
  }

  // Serve static assets from dist in production
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, "dist")));
  }
  app.all("*path", async (req: Request, res: Response, next: NextFunction) => {
    // Let Vite handle HTML requests
    try {
      const url = req.originalUrl;
      console.log("Handling request for:", url);

      // Read index.html
      const filePath = isProduction
        ? path.resolve(__dirname, "dist", "index.html")
        : path.resolve(__dirname, "index.html");

      if (isProduction) {
        const html = fs.readFileSync(filePath, "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
        return;
      }
      let template = await vite.transformIndexHtml(
        url,
        fs.readFileSync(filePath, "utf-8")
      );

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      console.error("Error handling request:", e);
      next(e);
    }
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Express error handler:", err);
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
      error: isProduction ? undefined : err.stack,
    });
  });
  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Vite middleware is active`);
  });
  return app;
}

startServer().catch((e: Error) => {
  console.error("Error starting server:", e);
});
