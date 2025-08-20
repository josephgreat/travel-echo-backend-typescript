"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const post_media_model_1 = require("#src/db/models/post-media.model");
const post_model_1 = require("#src/db/models/post.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const formstream_1 = require("#src/utils/formstream");
const helpers_1 = require("#src/utils/helpers");
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = __importDefault(require("cloudinary"));
/**
 * @api {put} /community/posts/:post_id/media/add
 * @par {post_id} @path The post ID
 * @desc Adds some media to the specified post
 * @domain {Community}
 * @use {Auth}
 * @body {FormData}
 * @res {json}
 * {
 *   "success": true,
 *   "files": {
 *      "uploaded": "number",
 *      "errored": "number"
 *    }
 * }
 */
exports.default = (0, api_1.defineApi)({
    group: "/community",
    path: "/posts/:post_id/media/add",
    method: "put"
}, (0, handlers_1.defineHandler)(async (req) => {
    const userId = req.user.id;
    const postId = req.params.postId;
    const post = await post_model_1.PostModel.findOne({
        _id: postId,
        user: userId
    });
    if (!post) {
        throw http_1.HttpException.notFound("Post not found");
    }
    const amount = await post_media_model_1.PostMediaModel.countDocuments({
        post: postId,
        user: userId
    });
    const formstream = new formstream_1.Formstream({
        headers: req.headers,
        limits: { files: constants_1.MAX_POST_MEDIA - amount, fileSize: constants_1.MAX_POST_MEDIA_SIZE }
    });
    const { data, error } = await formstream.execute(req, async ({ file }) => {
        const mediaPublicId = `${constants_1.POST_MEDIA_PUBLIC_ID_PREFIX}${postId.toString()}_${(0, helpers_1.randomString)(16, "numeric")}`;
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.v2.uploader.upload_stream({
                asset_folder: `${constants_1.CLOUDINARY_POST_MEDIA_FOLDER}/${postId.toString()}`,
                public_id: mediaPublicId,
                display_name: mediaPublicId,
                unique_filename: true
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (result) {
                    resolve({
                        _id: new mongoose_1.default.Types.ObjectId(),
                        url: result.secure_url,
                        name: result.display_name,
                        publicId: result.public_id,
                        assetId: result.asset_id,
                        format: result.format,
                        bytes: result.bytes,
                        user: userId,
                        post: post._id
                    });
                }
                else {
                    reject(new Error("No result from Cloudinary"));
                }
            });
            file.pipe(stream);
        });
    });
    if (error) {
        throw http_1.HttpException.badRequest(error.message);
    }
    const { files } = data;
    const { uploadedFiles, erroredFiles } = files.reduce((acc, file) => {
        if (file.error) {
            acc.erroredFiles.push(file);
        }
        else {
            acc.uploadedFiles.push(file);
        }
        return acc;
    }, { uploadedFiles: [], erroredFiles: [] });
    await Promise.all([
        post.updateOne({
            $set: { isEdited: true },
            $addToSet: {
                media: {
                    $each: uploadedFiles.map((file) => file.data?._id).filter(Boolean)
                }
            }
        }),
        post_media_model_1.PostMediaModel.create(uploadedFiles.map((file) => ({
            user: userId,
            post: postId,
            ...file.data
        })))
    ]);
    return {
        files: {
            uploaded: uploadedFiles.length,
            errored: erroredFiles.length
        }
    };
}));
