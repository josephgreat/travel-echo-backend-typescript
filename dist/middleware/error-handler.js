"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
const http_1 = require("#src/lib/api/http");
const logger_1 = __importDefault(require("#src/utils/logger"));
function errorHandler(err, req, res, next) {
    if (err instanceof http_1.HttpException) {
        res.status(err.statusCode).json(err.toJSON());
        return;
    }
    logger_1.default.error("Unhandled error:", err);
    /**
     * For production mode only
     * const serverError = HttpException.internal('Something went wrong');
     */
    const serverError = http_1.HttpException.internal(err.message);
    res.status(serverError.statusCode).json(serverError.toJSON());
}
