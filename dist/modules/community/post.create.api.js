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
const milestone_model_1 = require("#src/db/models/milestone.model");
exports.default = (0, api_1.defineApi)({
    path: "/posts",
    group: "/community",
    method: "post"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id: userId } = req.user;
    const postId = new mongoose_1.default.Types.ObjectId();
    const formstream = new formstream_1.Formstream({
        headers: req.headers,
        limits: { files: constants_1.MAX_POST_MEDIA, fileSize: constants_1.MAX_POST_MEDIA_SIZE }
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
                        post: postId
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
    const { fields, files } = data;
    const { uploadedFiles, erroredFiles } = files.reduce((acc, file) => {
        if (file.error) {
            acc.erroredFiles.push(file);
        }
        else {
            acc.uploadedFiles.push(file);
        }
        return acc;
    }, { uploadedFiles: [], erroredFiles: [] });
    const post = fields.reduce((acc, field) => {
        const object = {};
        if (field.name === "tags") {
            object[field.name] = field.value.split(",").map((val) => val.trim());
            acc = { ...acc, ...object };
            return acc;
        }
        object[field.name] = field.value;
        acc = { ...acc, ...object };
        return acc;
    }, {});
    const result = post_model_1.postSchema.safeParse(post);
    if (!result.success || (!result.data.content && uploadedFiles.length === 0)) {
        // delete images
        const publicIds = uploadedFiles
            .map((file) => file.data?.publicId)
            .filter((val) => typeof val === "string");
        await cloudinary_1.default.v2.api.delete_resources(publicIds, { invalidate: true });
        throw http_1.HttpException.badRequest(result.error?.issues[0]?.message || "Post is empty");
    }
    const validated = result.data;
    const [createdPost] = await Promise.all([
        post_model_1.PostModel.create({
            ...validated,
            _id: postId,
            user: userId,
            media: uploadedFiles.map((file) => file.data?._id),
            isReposting: !!validated.repostedPost
        }),
        post_media_model_1.PostMediaModel.create(uploadedFiles.map((file) => ({
            user: userId,
            post: postId,
            ...file.data
        }))),
        milestone_model_1.MilestoneModel.updateOne({ user: userId }, { $inc: { totalPosts: 1 } })
    ]);
    return {
        post: createdPost,
        media: {
            uploaded: uploadedFiles.length,
            errored: erroredFiles.length
        }
    };
}));
/**
 * @api {post} /community/posts
 * @desc Creates a post
 * @domain {Community}
 * @use {Auth}
 * @body {FormData}
 * @res {json}
 * {
 *   "success": true,
 *   "post": { ... },
 *   "media": {
 *    "uploaded": "number",
 *    "errored": "number"
 *   }
 * }
 */
