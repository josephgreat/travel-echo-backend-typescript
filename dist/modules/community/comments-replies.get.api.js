"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comment_model_1 = require("#src/db/models/comment.model");
const like_model_1 = require("#src/db/models/like.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
/**
 * @api {get} /community/posts/:post_id/comments/:comment_id/replies
 * @desc Gets a list of replies for a comment
 * @domain {Community}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "comments": [{...}],
 *   "pagination": {
 *     "skip": "number",
 *     "limit": "number",
 *     "returned": "number",
 *     "hasMore": "boolean"
 *   }
 * }
 * @use {Query}
 */
exports.default = (0, api_1.defineApi)({
    group: "/community",
    path: "/posts/:post_id/comments/:comment_id/replies",
    method: "get"
}, (0, handlers_1.defineHandler)(async (req) => {
    const userId = req.user.id;
    const postId = req.params.post_id;
    const commentId = req.params.comment_id;
    const { skip = 0, limit = 5, sort = {} } = req.parsedQuery || {};
    const comments = await comment_model_1.CommentModel.find({ post: postId, parentComment: commentId, isReplying: true }, {}, { skip, limit, sort: { createdAt: -1, ...sort } })
        .populate({
        path: "user",
        select: "_id name profile",
        populate: {
            path: "profile",
            select: "image"
        }
    })
        .lean();
    if (comments.length === 0) {
        return {
            comments: [],
            pagination: {
                skip: skip,
                limit: limit,
                returned: 0,
                hasMore: false
            }
        };
    }
    // Batch fetch likes for all posts to avoid N+1 query problem
    const commentIds = comments.map((comment) => comment._id);
    const userLikes = await like_model_1.LikeModel.find({
        user: userId,
        post: postId,
        comment: { $in: commentIds },
        target: like_model_1.LikeTarget.Comment
    }, { comment: 1 } // Only need the post field
    )
        .lean()
        .exec();
    // Create a Set for O(1) lookup performance
    const likedCommentIds = new Set(userLikes.map((like) => like.comment?.toString()));
    const formattedComments = comments.map((comment) => ({
        ...comment,
        author: {
            _id: comment.user._id,
            // @ts-expect-error population
            name: comment.user.name,
            // @ts-expect-error population
            image: comment.user.profile.image?.url ?? null,
            // @ts-expect-error population
            profileId: comment.user.profile._id
        },
        user: undefined,
        isLikedByViewer: likedCommentIds.has(comment._id.toString()),
        isViewedByAuthor: userId.toString() === comment.user._id.toString()
    }));
    return {
        comments: formattedComments,
        pagination: {
            skip: skip,
            limit: limit,
            returned: formattedComments.length,
            hasMore: formattedComments.length === limit
        }
    };
}));
