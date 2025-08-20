"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport_model_1 = require("#src/db/models/passport.model");
const passport_repository_1 = require("#src/db/repositories/passport.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const helpers_1 = require("#src/utils/helpers");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/passport",
    method: "put",
    middleware: (0, handlers_1.defineValidator)("body", passport_model_1.PassportZodSchema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const userId = req.user.id;
    const data = req.validatedBody;
    data.user = (0, helpers_1.castToObjectId)(userId);
    const passport = await passport_repository_1.passportRepository.updateOne({ user: userId }, data);
    if (!passport) {
        throw http_1.HttpException.notFound("Passport data not found");
    }
    return {
        passport
    };
}));
/**
 * @api {put} /users/me/passport
 * @desc Updates the user's passport data
 * @domain {User: Passport}
 * @use {ContentAuth}
 * @body {json}
 * {
 *  "user": "string",
    "passportNumber": "string",
    "passportType": "PassportType",
    "fullName": "string",
    "nationality": "string",
    "issueDate": "Date",
    "expiryDate": "Date",
    "placeOfIssue?": "string | null | undefined"
 * }
 * @res {json}
 * {
 *   "success": true,
 *   "passport": { ... }
 * }
 */
