"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const error_handler_1 = __importDefault(require("#src/middleware/error-handler"));
const cors_config_1 = __importDefault(require("#src/config/cors.config"));
const cloudinary_config_1 = __importDefault(require("#src/config/cloudinary.config"));
const node_path_1 = __importDefault(require("node:path"));
const route_gen_1 = require("./lib/api/route-gen");
const db_1 = require("./db/db");
const parse_request_query_1 = __importDefault(require("./middleware/parse-request-query"));
const routes_config_1 = require("./config/routes.config");
const logger_1 = __importDefault(require("./middleware/logger"));
(0, db_1.initializeDatabase)();
(0, cloudinary_config_1.default)();
exports.app = (0, express_1.default)();
async function main() {
    //Middleware
    exports.app.use(cors_config_1.default);
    exports.app.use(express_1.default.json());
    exports.app.use(express_1.default.urlencoded({ extended: false }));
    exports.app.use(express_1.default.static(node_path_1.default.resolve("public")));
    exports.app.use(logger_1.default);
    /**
     * API Documentation
     */
    exports.app.get("/doc", (req, res) => {
        const filePath = node_path_1.default.resolve("public/api.html");
        res.sendFile(filePath);
    });
    exports.app.get("/upload", (req, res) => {
        res.sendFile(node_path_1.default.resolve("public/html/upload.html"));
    });
    exports.app.get("/badges", (req, res) => {
        res.sendFile(node_path_1.default.resolve("public/html/badges/index.html"));
    });
    exports.app.use(parse_request_query_1.default);
    await (0, route_gen_1.generateRoutes)(exports.app, routes_config_1.routeConfig);
    exports.app.use(error_handler_1.default);
}
main();
