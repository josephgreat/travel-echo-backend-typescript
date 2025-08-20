"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_model_1 = require("#src/db/models/post.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const helpers_1 = require("#src/utils/helpers");
const comment_model_1 = require("#src/db/models/comment.model");
exports.default = (0, api_1.defineApi)({
    path: "/posts/:post_id/comments",
    group: "/community",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", comment_model_1.commentSchema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id: userId } = req.user;
    const postId = (0, helpers_1.castToObjectId)(req.params.post_id);
    const body = req.validatedBody;
    const post = await post_model_1.PostModel.findById(postId, { _id: 1 });
    if (!post) {
        throw http_1.HttpException.badRequest("Post not found");
    }
    const [comment] = await Promise.all([
        comment_model_1.CommentModel.create({
            user: userId,
            post: post._id,
            parentComment: body.parentComment,
            content: body.content,
            isReplying: !!body.parentComment
        }),
        post.updateOne({ $inc: { commentCount: 1 } }),
        body.parentComment
            ? comment_model_1.CommentModel.updateOne({ _id: body.parentComment }, { $inc: { replyCount: 1 } })
            : Promise.resolve()
    ]);
    return {
        comment
    };
}));
/**
 * @api {post} /community/posts/:post_id/comments
 * @par {post_id} @path The post ID
 * @desc Creates a comment
 * @domain {Community}
 * @use {Auth}
 * @body {json}
 * {
 *   "content": "string",
 *   "parentComment": "comment_id | optional | if the comment is replying to another"
 * }
 * @res {json}
 * {
 *   "success": true,
 *   "comment": { ... }
 * }
 */
