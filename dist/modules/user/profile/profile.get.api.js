"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = void 0;
const profile_repository_1 = require("#src/db/repositories/profile.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
/**
 * @api {get} /users/me/profile
 * @desc Get user profile. This endpoint will also create a minimal profile if the profile doesn't already exist
 * @domain {User: Profile}
 * @use {Auth}
 * @res {json} { "success": true, "profile": {...} }
 */
exports.getProfile = (0, api_1.defineApi)({ group: "/users/me", path: "/profile", method: "get" }, (0, handlers_1.defineHandler)(async (req) => {
    const id = req.user?.id;
    const profile = await profile_repository_1.profileRepository.findOne({ user: id });
    return { profile };
}));
