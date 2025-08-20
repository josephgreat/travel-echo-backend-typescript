"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const profile_repository_1 = require("#src/db/repositories/profile.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const cloudinary_1 = __importDefault(require("cloudinary"));
/**
 * @api {delete} /users/me/profile/image
 * @domain {User: Profile}
 * @desc Remove the user's profile image
 * @use {Auth}
 * @res {json} { "success": true, "message": "Profile image removed successfully" }
 */
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/profile/image",
    method: "delete"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const profile = await profile_repository_1.profileRepository.findOrCreate({ user: id }, { user: id });
    const { image } = profile;
    if (!image) {
        return http_1.HttpException.notFound("No profile image set");
    }
    try {
        await cloudinary_1.default.v2.uploader.destroy(image.publicId, { invalidate: true });
    }
    catch (error) {
        throw http_1.HttpException.internal(`Failed to delete image: ${error.message}`);
    }
    await profile_repository_1.profileRepository.updateOne(profile._id, { image: undefined });
    return {
        success: true,
        message: "Profile image removed succesfully"
    };
}));
