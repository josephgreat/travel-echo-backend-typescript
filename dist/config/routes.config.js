"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeConfig = void 0;
const user_model_1 = require("#src/db/models/user.model");
const auth_1 = __importDefault(require("#src/middleware/auth"));
exports.routeConfig = {
    globalPrefix: "/api/v1",
    groupMiddleware: {
        "/users/me": (0, auth_1.default)(user_model_1.UserRole.User),
        "/community": (0, auth_1.default)([user_model_1.UserRole.Admin, user_model_1.UserRole.User]),
    }
};
