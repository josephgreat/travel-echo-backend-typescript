"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const like_model_1 = require("#src/db/models/like.model");
const post_model_1 = require("#src/db/models/post.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
exports.default = (0, api_1.defineApi)({
    path: "/posts",
    group: "/community"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id: userId } = req.user;
    // Parse and validate query parameters
    const { skip = 0, limit = 5, sort = {} } = req.parsedQuery || {};
    // Validate numeric parameters
    const posts = await post_model_1.PostModel.find({ isPublic: true }, {}, // Select all fields - could be optimized by specifying only needed fields
    {
        skip,
        limit,
        sort: { createdAt: -1, ...sort }
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
        options: { limit: 4 }
    })
        .lean()
        .exec();
    // Early return if no posts found
    if (!posts || posts.length === 0) {
        return {
            posts: [],
            pagination: {
                skip: skip,
                limit: limit,
                returned: 0,
                hasMore: false
            }
        };
    }
    // Batch fetch likes for all posts to avoid N+1 query problem
    const postIds = posts.map((post) => post._id);
    const userLikes = await like_model_1.LikeModel.find({
        user: userId,
        post: { $in: postIds },
        target: like_model_1.LikeTarget.Post
    }, { post: 1 } // Only need the post field
    )
        .lean()
        .exec();
    // Create a Set for O(1) lookup performance
    const likedPostIds = new Set(userLikes.map((like) => like.post?.toString()));
    // Format posts with like status
    const formattedPosts = posts.map((post) => ({
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
        user: undefined,
        isLikedByViewer: likedPostIds.has(post._id.toString()),
        isViewedByAuthor: userId.toString() === post.user._id.toString(),
    }));
    return {
        posts: formattedPosts,
        pagination: {
            skip: skip,
            limit: limit,
            returned: formattedPosts.length,
            hasMore: formattedPosts.length === limit // Simple heuristic
        }
    };
}));
/**
 * @api {get} /community/posts
 * @desc Gets a list of public posts
 * @domain {Community}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "posts": [{...}],
 *   "pagination": {
 *     "skip": "number",
 *     "limit": "number",
 *     "returned": "number",
 *     "hasMore": "boolean"
 *   }
 * }
 * @use {Query}
 */
