import passport from "#src/config/passport.config";
import { UserRole } from "#src/db/models/user.model";
import { AuthUser } from "#src/types/user";
import { Request, Response, NextFunction } from "express";

export default function auth(role: UserRole | UserRole[], strict: boolean = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("jwt", (err: Error, user: AuthUser) => {
      if (err) {
        res.status(401).json({
          success: false,
          message: `Authentication failed: ${err.message}`
        });
        return;
      }
      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized. Please, log in" });
        return;
      }

      const allowedRoles = Array.isArray(role) ? role : [role];

      if (strict && !allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource"
        });
        return;
      }
      /* if (strict && user.role !== role) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource"
        });
        return;
      } */
      req.user = user;
      next();
    })(req, res, next);
  };
}
