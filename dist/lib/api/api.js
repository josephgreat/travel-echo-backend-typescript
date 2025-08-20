"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineApi = void 0;
const internal_only_1 = __importDefault(require("#src/middleware/internal-only"));
const defineApi = (options, ...handlers) => {
    let { path = "" } = options;
    const { expose = true, method = "get", group = "", middleware = [] } = options;
    if (!path && !group)
        throw new Error("Path or group is required");
    if (path.trim() === "/")
        path = "";
    const allMiddleware = Array.isArray(middleware) ? middleware : [middleware];
    const allHandlers = [];
    if (allMiddleware.length)
        allHandlers.push(...allMiddleware);
    allHandlers.push(...handlers);
    if (!expose) {
        allHandlers.unshift(internal_only_1.default);
    }
    const apiDefinition = {
        options: { path, expose, method, group },
        handlers: allHandlers
    };
    return apiDefinition;
};
exports.defineApi = defineApi;
