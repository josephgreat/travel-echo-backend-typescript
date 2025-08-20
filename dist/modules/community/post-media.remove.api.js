"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const post_media_model_1 = require("#src/db/models/post-media.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const zod_1 = require("zod");
const cloudinary_1 = __importDefault(require("cloudinary"));
const post_model_1 = require("#src/db/models/post.model");
const http_1 = require("#src/lib/api/http");
const schema = zod_1.z.object({
    media: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string({ message: "Each media ID must be a string" }),
        publicId: zod_1.z.string({ message: "Each media public ID must be a string" })
    }))
});
/**
 * @api {put} /community/posts/:post_id/media/remove
 * @par {post_id} @path The post ID
 * @desc Removes the specified post media
 * @domain {Community}
 * @use {Auth}
 * @bodyDesc {Payload must be an array of objects, each with object having the media id and the media public id}
 * @body {json}
 * {
 *   "media": [
 *     { "id": "id_1", "publicId": "public_id_1" },
 *     { "id": "id_2", "publicId": "public_id_2" },
 *     { "id": "id_3", "publicId": "public_id_3" }
 *   ]
 * }
 * @res {json}
 * {
 *   "success": true,
 *   "deleted": "number"
 * }
 */
exports.default = (0, api_1.defineApi)({
    group: "/community",
    path: "/posts/:post_id/media/remove",
    method: "put",
    middleware: (0, handlers_1.defineValidator)("body", schema)
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
    const { media } = req.validatedBody;
    const [mediaIds, mediaPublicIds] = media.reduce((acc, m) => {
        acc[0].push(m.id);
        acc[1].push(m.publicId);
        return acc;
    }, [[], []]);
    await Promise.all([
        post.updateOne({
            $set: { isEdited: true },
            $pull: { media: { $in: mediaIds } }
        }),
        post_media_model_1.PostMediaModel.deleteMany({ _id: { $in: mediaIds }, post: post._id }),
        cloudinary_1.default.v2.api.delete_resources(mediaPublicIds, {
            invalidate: true
        })
    ]);
    return {
        deleted: media.length
    };
}));
