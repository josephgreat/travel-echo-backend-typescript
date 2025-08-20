"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const comment_model_1 = require("#src/db/models/comment.model");
const like_model_1 = require("#src/db/models/like.model");
const milestone_model_1 = require("#src/db/models/milestone.model");
const post_media_model_1 = require("#src/db/models/post-media.model");
const post_model_1 = require("#src/db/models/post.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const logger_1 = __importDefault(require("#src/utils/logger"));
const cloudinary_1 = __importDefault(require("cloudinary"));
/**
 * @api {delete} /community/posts/:post_id
 * @par {post_id} @path The post ID
 * @desc Deletes the post with the provided ID
 * @domain {Community}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "deleted": "true"
 * }
 */
exports.default = (0, api_1.defineApi)({
    group: "/community",
    path: "/posts/:post_id",
    method: "delete"
}, (0, handlers_1.defineHandler)(async (req) => {
    const userId = req.user.id;
    const postId = req.params.post_id;
    const post = await post_model_1.PostModel.findById(postId);
    if (!post) {
        throw http_1.HttpException.notFound("Post not found");
    }
    // Authorization check
    if (post.user.toString() !== userId.toString()) {
        throw http_1.HttpException.forbidden("Not allowed");
    }
    // Get media before deletion for cleanup
    const media = await post_media_model_1.PostMediaModel.find({ post: postId });
    const publicIds = media.map((m) => m.publicId);
    // Database operations (critical path)
    const dbPromises = [
        post.deleteOne(),
        post_media_model_1.PostMediaModel.deleteMany({ post: postId }),
        comment_model_1.CommentModel.deleteMany({ post: postId }),
        like_model_1.LikeModel.deleteMany({ post: postId }),
        milestone_model_1.MilestoneModel.updateOne({ user: userId }, { $inc: { totalPosts: -1 } })
    ];
    if (post.repostedPost) {
        dbPromises.push(post_model_1.PostModel.updateOne({ _id: post.repostedPost }, { $inc: { repostCount: -1 } }));
    }
    // Execute DB operations first
    await Promise.all(dbPromises);
    // Cloudinary cleanup (non-critical, can fail without affecting DB)
    if (publicIds.length > 0) {
        try {
            await cloudinary_1.default.v2.api.delete_resources(publicIds, {
                invalidate: true
            });
            await cloudinary_1.default.v2.api.delete_folder(`${constants_1.CLOUDINARY_POST_MEDIA_FOLDER}/${postId}`);
        }
        catch (cloudinaryError) {
            logger_1.default.error("Cloudinary cleanup failed: ", cloudinaryError instanceof Error
                ? cloudinaryError
                : new Error(String(cloudinaryError)));
        }
    }
    return {
        deleted: true
    };
}));
// delete post
// delete post media
// if post is reposting update repost count on reposted post
// update totalPosts milestone for user
// delete all post comments
// delete all post likes
// delete all comment likes
