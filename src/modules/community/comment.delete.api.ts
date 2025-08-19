import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { castToObjectId } from "#src/utils/helpers";
import { CommentModel } from "#src/db/models/comment.model";
import { PostModel } from "#src/db/models/post.model";

export default defineApi(
  {
    path: "/posts/:post_id/comments/:comment_id",
    group: "/community",
    method: "delete"
  },
  defineHandler(async (req) => {
    const { id: userId } = req.user!;
    const postId = castToObjectId(req.params.post_id);
    const commentId = castToObjectId(req.params.comment_id);

    const comment = await CommentModel.findOne(
      { _id: commentId, user: userId, post: postId },
      { post: 1, parentComment: 1 }
    );

    if (!comment) {
      throw HttpException.notFound("Comment not found");
    }

    await Promise.all([
      comment.deleteOne(),
      CommentModel.deleteMany({ parentComment: commentId }),
      PostModel.updateOne(
        { _id: comment.post },
        { $inc: { commentCount: -1 } }
      ),
      comment.parentComment
        ? CommentModel.updateOne(
            { _id: comment.parentComment },
            { $inc: { replyCount: -1 } }
          )
        : Promise.resolve()
    ]);

    return {
      deleted: true
    };
  })
);

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
