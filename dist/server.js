"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const app_1 = require("./app");
const env_1 = __importDefault(require("#src/utils/env"));
const logger_1 = __importDefault(require("#src/utils/logger"));
const PORT = env_1.default.get("PORT", 8000);
const BASE_URL = env_1.default.get("BASE_URL");
const server = node_http_1.default.createServer(app_1.app);
server.listen(PORT, () => {
    logger_1.default.info(`Server is running on ${env_1.default.get("NODE_ENV") !== "production" ? BASE_URL : `port ${PORT}`}`);
});
server.on("error", (error) => {
    logger_1.default.error("Server error", error);
    process.exit(1);
});
process.on("SIGINT", () => {
    server.close(() => {
        logger_1.default.info("Server closed.");
        process.exit(0);
    });
});
