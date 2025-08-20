"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const helpers_1 = require("#src/utils/helpers");
const comment_model_1 = require("#src/db/models/comment.model");
exports.default = (0, api_1.defineApi)({
    path: "/posts/:post_id/comments/:comment_id",
    group: "/community",
    method: "put",
    middleware: (0, handlers_1.defineValidator)("body", comment_model_1.commentSchema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id: userId } = req.user;
    const postId = (0, helpers_1.castToObjectId)(req.params.post_id);
    const commentId = (0, helpers_1.castToObjectId)(req.params.comment_id);
    const body = req.validatedBody;
    const data = { content: body.content };
    const comment = await comment_model_1.CommentModel.findOneAndUpdate({ _id: commentId, user: userId, post: postId }, { $set: { content: data.content, isEdited: true } });
    if (!comment) {
        throw http_1.HttpException.notFound("Comment not found");
    }
    return {
        comment
    };
}));
/**
 * @api {put} /community/posts/:post_id/comments/:comment_id
 * @par {post_id} @path The post ID
 * @par {comment_id} @path The comment ID
 * @desc Updates the content of a comment
 * @domain {Community}
 * @use {Auth}
 * @body {json}
 * {
 *   "content": "string"
 * }
 * @res {json}
 * {
 *   "success": true,
 *   "updated": true
 * }
 */
