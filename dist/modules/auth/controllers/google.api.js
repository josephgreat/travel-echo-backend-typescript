"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthCallback = exports.signInWithGoogle = void 0;
const api_1 = require("#src/lib/api/api");
const passport_config_1 = __importDefault(require("#src/config/passport.config"));
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
exports.signInWithGoogle = (0, api_1.defineApi)({ group: "/google", path: "", method: "get" }, passport_config_1.default.authenticate("google", { scope: ["profile", "email"] }));
exports.googleAuthCallback = (0, api_1.defineApi)({ group: "/google", path: "/callback", method: "get" }, passport_config_1.default.authenticate("google", { session: false }), (0, handlers_1.defineHandler)(() => {
    return http_1.HttpResponse.success("Login with Google successful");
}));
