import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { castToObjectId } from "#src/utils/helpers";
import {
  CommentModel,
  CommentSchema,
  commentSchema
} from "#src/db/models/comment.model";

export default defineApi(
  {
    path: "/posts/:post_id/comments/:comment_id",
    group: "/community",
    method: "put",
    middleware: defineValidator("body", commentSchema)
  },
  defineHandler(async (req) => {
    const { id: userId } = req.user!;
    const postId = castToObjectId(req.params.post_id);
    const commentId = castToObjectId(req.params.comment_id);
    const body = req.validatedBody as CommentSchema;

    const data = { content: body.content };

    const comment = await CommentModel.findOneAndUpdate(
      { _id: commentId, user: userId, post: postId },
      { $set: { content: data.content, isEdited: true } }
    );

    if (!comment) {
      throw HttpException.notFound("Comment not found");
    }

    return {
      comment
    };
  })
);

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
