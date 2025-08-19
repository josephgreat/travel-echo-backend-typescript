import { LikeModel, LikeTarget } from "#src/db/models/like.model";
import { PostModel } from "#src/db/models/post.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

/**
 * @api {put} /community/posts/:post_id/toggle-like
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
    method: "put"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id.toString();
    const postId = req.params.post_id;

    const like = await LikeModel.findOne({
      post: postId,
      user: userId,
      target: LikeTarget.Post
    });
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
        LikeModel.create({
          user: userId,
          post: postId,
          target: LikeTarget.Post
        }),
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
