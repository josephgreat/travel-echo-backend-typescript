import { CommentModel } from "#src/db/models/comment.model";
import { LikeModel, LikeTarget } from "#src/db/models/like.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

/**
 * @api {get} /community/posts/:post_id/comments
 * @desc Gets a list of comments for a post
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

export default defineApi(
  {
    group: "/community",
    path: "/posts/:post_id/comments",
    method: "get"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;
    const postId = req.params.post_id;

    const { skip = 0, limit = 5, sort = {} } = req.parsedQuery || {};

    const comments = await CommentModel.find(
      { post: postId, isReplying: false },
      {},
      { skip, limit, sort: { createdAt: -1, ...sort } }
    )
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
    const userLikes = await LikeModel.find(
      {
        user: userId,
        post: postId,
        comment: { $in: commentIds },
        target: LikeTarget.Comment
      },
      { comment: 1 } // Only need the post field
    )
      .lean()
      .exec();

    // Create a Set for O(1) lookup performance
    const likedCommentIds = new Set(
      userLikes.map((like) => like.comment?.toString())
    );

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
  })
);
