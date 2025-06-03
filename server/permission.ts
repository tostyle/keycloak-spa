import { NextFunction, Request, Response } from "express";
import { UserProfile } from "./types";
import { checkDecision, listPermissions } from "./keycloak-adapter";

export const permissionMiddleware = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserProfile;
    try {
      console.log("Checking permission for user:", user.username);
      const response: any = await checkDecision(
        user?.accessToken ?? "",
        requiredPermission
      );
      const isAuthorized = !!response.result;
      console.log(
        "Permission check for",
        requiredPermission,
        ":",
        isAuthorized
      );
      if (!isAuthorized) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
      return;
    } catch (error) {
      console.error("Error in permission middleware:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  };
};

export const checkPermission = async (req: Request, res: Response) => {
  const user = req.user as UserProfile;
  if (!req.params.resource || !req.params.scope) {
    console.warn(
      "Bad Request: Missing resource or scope in request parameters"
    );
    res.status(400).json({ error: "Bad Request: Missing resource or scope" });
    return;
  }
  const permission = `${req.params.resource}#${req.params.scope}`;
  try {
    const response: any = await checkDecision(
      user?.accessToken ?? "",
      permission
    );
    const isAuthorized = !!response.result;
    if (!isAuthorized) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    // next();
    res.json({
      message: `User ${user.username} has permission for ${permission}`,
    });
  } catch (error) {
    console.error("Error in permission middleware:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as UserProfile;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const response: any = await listPermissions(user.accessToken ?? "");
    const permissions = response ?? [];
    const acls = permissions.reduce((accessList: string[], permission: any) => {
      if (!permission.scopes) {
        accessList.push(permission.rsname);
        return accessList;
      }
      const acls = permission.scopes.map((scope: string) => {
        return `${permission.rsname}#${scope}`;
      });
      // console.log("acls", acls);
      accessList.push(...acls);
      return accessList;
    }, []);
    res.json(acls);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
