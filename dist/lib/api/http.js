"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpException = exports.HttpResponse = void 0;
class HttpResponse {
    constructor(statusCode, message, data) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode >= 200 && statusCode < 300;
    }
    // Method to send the response
    send(res) {
        res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            ...(this.data && { data: this.data })
        });
    }
    // Static methods to create common responses
    static success(message = "Success", data) {
        return new HttpResponse(200, message, data);
    }
    static created(message = "Created", data) {
        return new HttpResponse(201, message, data);
    }
    static badRequest(message = "Bad Request", data) {
        return new HttpResponse(400, message, data);
    }
    static unauthorized(message = "Unauthorized", data) {
        return new HttpResponse(401, message, data);
    }
    static forbidden(message = "Forbidden", data) {
        return new HttpResponse(403, message, data);
    }
    static notFound(message = "Not Found", data) {
        return new HttpResponse(404, message, data);
    }
    static internal(message = "Internal Server Error", data) {
        return new HttpResponse(500, message, data);
    }
}
exports.HttpResponse = HttpResponse;
class HttpException extends Error {
    constructor(statusCode, message, options = {}) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.data = options.data;
        this.errorCode = options.errorCode;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HttpException);
        }
    }
    static badRequest(message = "Bad request", data) {
        return new HttpException(400, message, { data, errorCode: "BAD_REQUEST" });
    }
    static unauthorized(message = "Unauthorized") {
        return new HttpException(401, message, { errorCode: "UNAUTHORIZED" });
    }
    static forbidden(message = "Forbidden") {
        return new HttpException(403, message, { errorCode: "FORBIDDEN" });
    }
    static notFound(message = "Resource not found") {
        return new HttpException(404, message, { errorCode: "NOT_FOUND" });
    }
    static conflict(message = "Conflict occurred") {
        return new HttpException(409, message, { errorCode: "CONFLICT" });
    }
    static internal(message = "Internal server error", data) {
        return new HttpException(500, message, {
            data,
            errorCode: "INTERNAL_SERVER_ERROR"
        });
    }
    toJSON() {
        return {
            success: false,
            statusCode: this.statusCode,
            message: this.message,
            ...(this.errorCode && { errorCode: this.errorCode }),
            ...(this.data && { data: this.data }),
            ...(process.env.NODE_ENV === "development" && { stack: this.stack })
        };
    }
}
exports.HttpException = HttpException;
