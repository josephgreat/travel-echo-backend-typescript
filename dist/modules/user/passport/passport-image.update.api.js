"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_repository_1 = require("#src/db/repositories/passport.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const formstream_1 = require("#src/utils/formstream");
const helpers_1 = require("#src/utils/helpers");
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/passport/:passportId/images",
    method: "put"
}, (0, handlers_1.defineHandler)(async (req) => {
    const userId = req.user.id;
    const { passportId } = req.params;
    const passport = await passport_repository_1.passportRepository.findOne({
        _id: passportId,
        user: userId
    });
    if (!passport) {
        throw http_1.HttpException.notFound("Passport data not found");
    }
    const formstream = new formstream_1.Formstream({
        headers: req.headers,
        limits: {
            fileSize: constants_1.MAX_PASSPORT_IMAGE_SIZE
        }
    });
    const { data, error } = await formstream.execute(req, async ({ file }) => {
        const imagePublicId = constants_1.PASSPORT_IMAGE_PUBLIC_ID_PREFIX.concat(passport._id.toString()).concat(`_${(0, helpers_1.randomString)(16, "numeric")}`);
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.v2.uploader.upload_stream({
                asset_folder: `${constants_1.CLOUDINARY_PASSPORT_IMAGES_FOLDER}/${passportId}`,
                public_id: imagePublicId,
                display_name: imagePublicId,
                unique_filename: true
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (!result)
                    return reject(new Error("No result from Cloudinary"));
                resolve({
                    url: result.secure_url,
                    name: result.display_name,
                    publicId: result.public_id,
                    assetId: result.asset_id,
                    format: result.format,
                    bytes: result.bytes
                });
            });
            file.pipe(stream);
        });
    });
    if (error) {
        throw http_1.HttpException.internal(`Upload failed: ${error.message}`);
    }
    const { files } = data;
    // 6️⃣ Delete existing images from Cloudinary
    if (passport.images && passport.images.length > 0) {
        for (const oldImage of passport.images) {
            if (oldImage?.publicId) {
                await cloudinary_1.default.v2.uploader.destroy(oldImage.publicId, {
                    invalidate: true
                });
            }
        }
    }
    // 7️⃣ Replace images in DB
    const updatedPassport = await passport_repository_1.passportRepository.updateOne(passport._id, {
        images: files.map((file) => file.data).filter((file) => !!file)
    });
    if (!updatedPassport) {
        throw http_1.HttpException.internal("Failed to update passport images");
    }
    // 8️⃣ Return result
    return {
        images: updatedPassport.images
    };
}));
/**
 * @api {put} /users/me/passport/:passportId/images
 * @desc Upload multiple passport images (replaces old ones)
 * @domain {User: Passport}
 * @use {Auth}
 * @body {FormData} Form Data (field: passportImages[])
 * @res {json}
 * {
 *  "success": true,
 *  "images": [
 *    {
 *      "url": "...",
 *      "name": "...",
 *      "publicId": "...",
 *      ...
 *    }
 *  ]
 * }
 */
