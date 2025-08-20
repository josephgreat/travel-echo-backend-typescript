"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport_repository_1 = require("#src/db/repositories/passport.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/passport",
    method: "get"
}, (0, handlers_1.defineHandler)(async (req) => {
    const id = req.user.id;
    const passports = await passport_repository_1.passportRepository.findMany({
        user: id
    });
    if (!passports) {
        throw http_1.HttpException.notFound("Passport data not found");
    }
    return {
        success: true,
        passports
    };
}));
/**
 * @api {get} /users/me/passport
 * @desc Gets the user's passport information
 * @domain {User: Passport}
 * @use {Auth}
 * @res {json} { "success": true, "passport": {...} }
 */
