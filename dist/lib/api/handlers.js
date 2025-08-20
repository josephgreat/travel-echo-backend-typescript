"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineValidator = exports.defineHandler = void 0;
const http_1 = require("./http");
const node_stream_1 = __importDefault(require("node:stream"));
const defineHandler = (fn) => {
    return async (req, res, next) => {
        try {
            const result = await fn(req, res, next);
            if (res.headersSent)
                return;
            if (result instanceof http_1.HttpResponse) {
                result.send(res);
                return;
            }
            if (result instanceof http_1.HttpException) {
                next(result);
                return;
            }
            if (result instanceof node_stream_1.default.Readable) {
                result.pipe(res);
                return;
            }
            if (result === undefined || result === null) {
                res.status(204).send();
                return;
            }
            const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 200;
            if (typeof result === "string" ||
                typeof result === "number" ||
                typeof result === "boolean" ||
                result instanceof Date ||
                result instanceof Buffer) {
                res.status(statusCode).send(result);
                return;
            }
            const success = statusCode >= 200 && statusCode < 300;
            try {
                res.status(statusCode).json({ success, statusCode, ...result });
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            }
            catch (error) {
                res.status(statusCode).send(result);
            }
        }
        catch (error) {
            next(error);
        }
    };
};
exports.defineHandler = defineHandler;
/**
 * Defines a validation middleware that parses and attaches the validated data to the request object.
 *
 * @param path - Which part of the request to validate (body, query, params, headers)
 * @param schema - The Zod schema to use for validation
 * @param options - Optional custom error handling
 * @returns Express middleware
 */
const defineValidator = (path, schema, options = {}) => {
    return (req, res, next) => {
        const data = req[path];
        const result = schema.safeParse(data);
        if (result.success) {
            const parsed = result.data;
            switch (path) {
                case "body":
                    req.validatedBody = parsed;
                    break;
                case "query":
                    req.validatedQuery = parsed;
                    break;
                case "params":
                    req.validatedParams = parsed;
                    break;
                case "headers":
                    req.validatedHeaders = parsed;
                    break;
            }
            if (options.onSuccess) {
                return options.onSuccess(parsed, req, res, next);
            }
            return next();
        }
        const validationError = result.error;
        if (options.onError) {
            return options.onError(validationError, req, res, next);
        }
        const errorMessage = options.errorMessage || validationError.errors[0].message;
        const error = new http_1.HttpException(400, errorMessage, {
            errorCode: options.errorCode || `VALIDATION_ERROR_${path.toUpperCase()}`,
            data: {
                errors: validationError.errors
            }
        });
        next(error);
    };
};
exports.defineValidator = defineValidator;
