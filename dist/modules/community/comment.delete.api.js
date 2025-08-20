"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const helpers_1 = require("#src/utils/helpers");
const comment_model_1 = require("#src/db/models/comment.model");
const post_model_1 = require("#src/db/models/post.model");
exports.default = (0, api_1.defineApi)({
    path: "/posts/:post_id/comments/:comment_id",
    group: "/community",
    method: "delete"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id: userId } = req.user;
    const postId = (0, helpers_1.castToObjectId)(req.params.post_id);
    const commentId = (0, helpers_1.castToObjectId)(req.params.comment_id);
    const comment = await comment_model_1.CommentModel.findOne({ _id: commentId, user: userId, post: postId }, { post: 1, parentComment: 1 });
    if (!comment) {
        throw http_1.HttpException.notFound("Comment not found");
    }
    await Promise.all([
        comment.deleteOne(),
        comment_model_1.CommentModel.deleteMany({ parentComment: commentId }),
        post_model_1.PostModel.updateOne({ _id: comment.post }, { $inc: { commentCount: -1 } }),
        comment.parentComment
            ? comment_model_1.CommentModel.updateOne({ _id: comment.parentComment }, { $inc: { replyCount: -1 } })
            : Promise.resolve()
    ]);
    return {
        deleted: true
    };
}));
/**
 * @api {delete} /community/posts/:post_id/comments/:comment_id
 * @par {post_id} @path The post ID
 * @par {comment_id} @path The comment ID
 * @desc Deletes a comment
 * @domain {Community}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "deleted": true
 * }
 */
