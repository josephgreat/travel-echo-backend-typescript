"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = auth;
const passport_config_1 = __importDefault(require("#src/config/passport.config"));
function auth(role, strict = true) {
    return (req, res, next) => {
        passport_config_1.default.authenticate("jwt", (err, user) => {
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
