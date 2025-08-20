"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const like_model_1 = require("#src/db/models/like.model");
const post_model_1 = require("#src/db/models/post.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
/**
 * @api {put} /community/posts/:post_id/toggle-like
 * @par {post_id} @path The post ID
 * @desc Likes or unlikes the post with the provided ID
 * @domain {Community}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "isLiked": "boolean"
 * }
 */
exports.default = (0, api_1.defineApi)({
    path: "/posts/:post_id/toggle-like",
    group: "/community",
    method: "put"
}, (0, handlers_1.defineHandler)(async (req) => {
    const userId = req.user.id.toString();
    const postId = req.params.post_id;
    const like = await like_model_1.LikeModel.findOne({
        post: postId,
        user: userId,
        target: like_model_1.LikeTarget.Post
    });
    let isLiked = false;
    if (like) {
        // Unlike the post
        await Promise.all([
            // remove like record
            like.deleteOne(),
            post_model_1.PostModel.updateOne({ _id: postId }, { $inc: { likeCount: -1 } })
        ]);
        isLiked = false;
    }
    else {
        // Like the post
        await Promise.all([
            like_model_1.LikeModel.create({
                user: userId,
                post: postId,
                target: like_model_1.LikeTarget.Post
            }),
            post_model_1.PostModel.updateOne({ _id: postId }, { $inc: { likeCount: 1 } })
        ]);
        isLiked = true;
    }
    return {
        isLiked,
        message: `Post has been ${isLiked ? "liked" : "unliked"}`
    };
}));
