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

dotenv.config();

const PORT = process.env.PORT || 4001;

// Middleware to check if user is authenticated
function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

async function startServer(): Promise<Express> {
  const app = express();
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    configFile: path.resolve(__dirname, "vite.config.js"),
  });

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: process.env.NODE_ENV === "production" },
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
        console.log("OIDC accessToken:", accessToken);
        console.log("OIDC refreshToken:", refreshToken);
        console.log("OIDC idToken:", idToken);

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

  // Login route
  app.get("/auth/login", passport.authenticate("oidc"));

  // Callback route
  app.get(
    "/auth/callback",
    passport.authenticate("oidc", {
      successRedirect: "/admin",
      failureRedirect: "/auth/login",
    })
  );

  // Profile route (protected)
  app.get("/profile", isAuthenticated, (req: Request, res: Response) => {
    console.log("User profile:", req.user);
    res.json({
      user: req.user,
    });
  });

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
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static assets from dist in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(__dirname, "dist")));

    app.all("*path", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    // In development, serve the index.html file from Vite
    app.all(
      "*path",
      async (req: Request, res: Response, next: NextFunction) => {
        // Let Vite handle HTML requests
        try {
          const url = req.originalUrl;
          console.log("Handling request for:", url);

          // Read index.html
          let template = await vite.transformIndexHtml(
            url,
            fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8")
          );

          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          console.error("Error handling request:", e);
          next(e);
        }
      }
    );
  }

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
