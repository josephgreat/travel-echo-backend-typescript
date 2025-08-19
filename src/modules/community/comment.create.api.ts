import { PostModel } from "#src/db/models/post.model";
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
    path: "/posts/:post_id/comments",
    group: "/community",
    method: "post",
    middleware: defineValidator("body", commentSchema)
  },
  defineHandler(async (req) => {
    const { id: userId } = req.user!;
    const postId = castToObjectId(req.params.post_id);
    const body = req.validatedBody as CommentSchema;

    const post = await PostModel.findById(postId, { _id: 1 });

    if (!post) {
      throw HttpException.badRequest("Post not found");
    }

    const [comment] = await Promise.all([
      CommentModel.create({
        user: userId,
        post: post._id,
        parentComment: body.parentComment,
        content: body.content,
        isReplying: !!body.parentComment
      }),
      post.updateOne({ $inc: { commentCount: 1 } }),
      body.parentComment
        ? CommentModel.updateOne(
            { _id: body.parentComment },
            { $inc: { replyCount: 1 } }
          )
        : Promise.resolve()
    ]);

    return {
      comment
    };
  })
);

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
