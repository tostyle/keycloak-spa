import { NextFunction, Request, Response } from "express";
import { UserProfile } from "./types";
import { checkDecision, listPermissions } from "./keycloak-adapter";

export const permissionMiddleware = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserProfile;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const response = await checkDecision(
      user.accessToken ?? "",
      requiredPermission
    );
    const isAuthorized = !!response.data?.result;
    console.log("Permission check for", requiredPermission, ":", isAuthorized);
    if (!isAuthorized) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
    return;
  };
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
    const response = await listPermissions(user.accessToken ?? "");
    const permissions = response.data ?? [];
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
