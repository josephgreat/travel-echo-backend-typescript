import { CommentModel } from "#src/db/models/comment.model";
import { LikeModel, LikeTarget } from "#src/db/models/like.model";
import { PostModel } from "#src/db/models/post.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

/**
 * @api {put} /community/posts/:post_id/comments/:comment_id/toggle-like
 * @par {post_id} @path The post ID
 * @par {comment_id} @path The comment ID
 * @desc Likes or unlikes the comment with the provided ID
 * @domain {Community}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "isLiked": "boolean"
 * }
 */

export default defineApi(
  {
    path: "/posts/:post_id/comments/:comment_id/toggle-like",
    group: "/community",
    method: "put"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id.toString();
    const postId = req.params.post_id;
    const commentId = req.params.comment_id;

    const like = await LikeModel.findOne({
      post: postId,
      user: userId,
      comment: commentId,
      target: LikeTarget.Comment
    });
    let isLiked: boolean = false;

    if (like) {
      // Unlike the post

      await Promise.all([
        // remove like record
        like.deleteOne(),
        CommentModel.updateOne({ _id: postId }, { $inc: { likeCount: -1 } })
      ]);

      isLiked = false;
    } else {
      // Like the post
      await Promise.all([
        LikeModel.create({
          user: userId,
          post: postId,
          comment: commentId,
          target: LikeTarget.Comment
        }),
        PostModel.updateOne({ _id: postId }, { $inc: { likeCount: 1 } })
      ]);

      isLiked = true;
    }

    return {
      isLiked,
      message: `Comment has been ${isLiked ? "liked" : "unliked"}`
    };
  })
);
