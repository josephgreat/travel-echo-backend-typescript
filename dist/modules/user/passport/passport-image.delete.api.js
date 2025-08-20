"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_repository_1 = require("#src/db/repositories/passport.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const cloudinary_1 = __importDefault(require("cloudinary"));
const constants_1 = require("#src/utils/constants");
/**
 * @api {delete} /users/me/passport/image
 * @domain {User: Passport}
 * @desc Deletes the passport image
 * @use {Auth}
 * @res {json} { "success": true, "message": "Passport image deleted successfully" }
 */
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/passport/image",
    method: "delete"
}, (0, handlers_1.defineHandler)(async (req) => {
    const userId = req.user.id;
    const passport = await passport_repository_1.passportRepository.findOne({ user: userId });
    if (!passport) {
        throw http_1.HttpException.notFound("Passport data not found");
    }
    const { images } = passport;
    if (!images || images.length === 0) {
        return http_1.HttpException.notFound("No previous passport image");
    }
    try {
        await Promise.all(images.map((img) => cloudinary_1.default.v2.uploader.destroy(img.publicId, { invalidate: true })));
        await Promise.all([
            cloudinary_1.default.v2.api.delete_folder(`${constants_1.CLOUDINARY_PASSPORT_IMAGES_FOLDER}/${passport._id.toString()}`),
            passport_repository_1.passportRepository.updateOne({ _id: passport._id, user: userId }, { images: [] })
        ]);
        return {
            success: true,
            message: "Passport images deleted succesfully"
        };
    }
    catch (error) {
        throw http_1.HttpException.internal(`Failed to delete images: ${error.message}`);
    }
}));
