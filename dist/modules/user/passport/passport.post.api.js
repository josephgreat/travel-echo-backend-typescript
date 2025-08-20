"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport_model_1 = require("#src/db/models/passport.model");
const passport_repository_1 = require("#src/db/repositories/passport.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/passport",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", passport_model_1.PassportZodSchema)
}, (0, handlers_1.defineHandler)(async (req, res) => {
    const data = req.validatedBody;
    const passport = await passport_repository_1.passportRepository.create(data);
    res.statusCode = 201;
    return {
        passport
    };
}));
/**
 * @api {post} /users/me/passport
 * @desc Creates new passport data
 * @domain {User: Passport}
 * @use {ContentAuth}
 * @body {json}
 * {
 *  "user": "string";
    "passportNumber": "string";
    "passportType": "PassportType";
    "fullName": "string";
    "nationality": "string";
    "issueDate": "Date";
    "expiryDate": "Date";
    "placeOfIssue?": "string | null | undefined";
 * }
 * @res {json}
 * {
 *   "success": true,
 *   "passport": { ... }
 * }
 */
