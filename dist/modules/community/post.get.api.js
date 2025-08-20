"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const like_model_1 = require("#src/db/models/like.model");
const post_model_1 = require("#src/db/models/post.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
exports.default = (0, api_1.defineApi)({
    path: "/posts/:post_id",
    group: "/community"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id: userId } = req.user;
    const post_id = req.params.post_id.toString();
    const post = await post_model_1.PostModel.findOne({
        _id: post_id,
        $or: [{ isPublic: true }, { isPublic: false, user: userId }]
    })
        .populate({
        path: "user",
        select: "_id name profile",
        populate: {
            path: "profile",
            select: "image"
        }
    })
        .populate({
        path: "repostedPost",
        select: "_id content createdAt media user",
        populate: [
            {
                path: "user",
                select: "_id name profile",
                populate: {
                    path: "profile",
                    select: "image"
                }
            },
            {
                path: "media",
                options: { limit: 4 }
            }
        ]
    })
        .populate({
        path: "media",
        //options: { limit: 4 }
    })
        .lean()
        .exec();
    if (!post) {
        throw http_1.HttpException.notFound("Post not found.");
    }
    const like = await like_model_1.LikeModel.findOne({ user: userId, post: post?._id, target: like_model_1.LikeTarget.Post });
    const formattedPost = {
        ...post,
        author: {
            _id: post.user._id,
            // @ts-expect-error population
            name: post.user.name,
            // @ts-expect-error population
            image: post.user.profile.image?.url ?? null,
            // @ts-expect-error population
            profileId: post.user.profile._id
        },
        isLikedByViewer: !!like,
        isViewedByAuthor: userId.toString() === post.user._id.toString(),
        user: undefined
    };
    return {
        post: formattedPost
    };
}));
/**
 * @api {get} /community/posts/:post_id
 * @par {post_id} @path The post ID
 * @desc Gets a post by its ID
 * @domain {Community}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "post": { ... }
 * }
 */
