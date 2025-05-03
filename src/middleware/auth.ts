import passport from "#src/config/passport.config";
import { UserRole } from "#src/db/models/user.model";
import { AuthUser } from "#src/types/user";
import { Request, Response, NextFunction } from "express";

export default function auth(role: UserRole) {
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
      if (user.role !== role) {
        res
          .status(403)
          .json({
            success: false,
            message: "Forbidded. You are not allowed to access this resource"
          });
      }
      req.user = user;
      next();
    })(req, res, next);
  };
}
