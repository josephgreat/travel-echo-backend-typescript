import { LikeModel } from "#src/db/models/like.model";
import { PostModel } from "#src/db/models/post.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

/**
 * @api {post} /community/posts/:post_id/toggle-like
 * @par {post_id} @path The post ID
 * @desc Likes or unlikes the post with the provided ID
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
    path: "/posts/:post_id/toggle-like",
    group: "/community",
    method: "post"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id.toString();
    const postId = req.params.post_id;

    const like = await LikeModel.findOne({ post: postId, user: userId });
    let isLiked: boolean = false;

    if (like) {
      // Unlike the post

      await Promise.all([
        // remove like record
        like.deleteOne(),
        PostModel.updateOne({ _id: postId }, { $inc: { likeCount: -1 } })
      ]);

      isLiked = false;
    } else {
      // Like the post
      await Promise.all([
        LikeModel.create({ user: userId, post: postId }),
        PostModel.updateOne({ _id: postId }, { $inc: { likeCount: 1 } })
      ]);

      isLiked = true;
    }

    return {
      isLiked,
      message: `Post has been ${isLiked ? "liked" : "unliked"}`
    };
  })
);
