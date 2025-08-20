"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_model_1 = require("#src/db/models/post.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
/**
 * @api {put} /community/posts/:post_id
 * @par {post_id} @path The post ID
 * @desc Updates the content, tags, and public status of a post. Send the full post along with the updated fields
 * @domain {Community}
 * @use {Auth}
 * @body {json}
 * {
 *   "content": "string",
 *   "tags": [],
 *   "isPublic": "boolean"
 * }
 * @res {json}
 * {
 *   "success": true,
 *   "updated": true
 * }
 */
exports.default = (0, api_1.defineApi)({
    group: "/community",
    path: "/posts/:post_id",
    method: "put",
    middleware: (0, handlers_1.defineValidator)("body", post_model_1.postSchema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const userId = req.user.id;
    const postId = req.params.post_id;
    const body = req.validatedBody;
    const { content, tags, isPublic } = body;
    const post = await post_model_1.PostModel.findOne({ _id: postId, user: userId });
    if (!post) {
        throw http_1.HttpException.notFound("Post not found");
    }
    post.content = content;
    post.tags = tags;
    post.isPublic = isPublic ?? post.isPublic;
    post.isEdited = true;
    await post.save();
    return {
        updated: true
    };
}));
