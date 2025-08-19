import { PostModel, PostSchema, postSchema } from "#src/db/models/post.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";

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

export default defineApi(
  {
    group: "/community",
    path: "/posts/:post_id",
    method: "put",
    middleware: defineValidator("body", postSchema)
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;
    const postId = req.params.post_id;
    const body = req.validatedBody as PostSchema;
    const { content, tags, isPublic } = body;

    const post = await PostModel.findOne({ _id: postId, user: userId });

    if (!post) {
      throw HttpException.notFound("Post not found");
    }

    post.content = content;
    post.tags = tags;
    post.isPublic = isPublic ?? post.isPublic;
    post.isEdited = true;

    await post.save();

    return {
      updated: true
    };
  })
);
