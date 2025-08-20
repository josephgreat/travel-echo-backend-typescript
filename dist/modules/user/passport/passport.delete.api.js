"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport_repository_1 = require("#src/db/repositories/passport.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/passport/:passportId",
    method: "delete"
}, (0, handlers_1.defineHandler)(async (req) => {
    const userId = req.user.id;
    const { passportId } = req.params;
    if (!passportId) {
        throw http_1.HttpException.badRequest("Passport ID is required");
    }
    const result = await passport_repository_1.passportRepository.deleteOne({
        _id: passportId,
        user: userId
    });
    if (result.deletedCount === 0) {
        throw http_1.HttpException.notFound("Passport not found or you do not have permission to delete it");
    }
    return {
        success: true,
        message: "Passport deleted successfully"
    };
}));
/**
 * @api {delete} /users/me/passport/:passportId
 * @desc Deletes a specific passport of the authenticated user by ID
 * @domain {User: Passport}
 * @use {Auth}
 * @param {String} passportId
 * @res {json} { "success": true, "message": "Passport deleted successfully" }
 */
