import { LikeModel } from "#src/db/models/like.model";
import { PostModel } from "#src/db/models/post.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

export default defineApi(
  {
    path: "/posts/:post_id",
    group: "/community"
  },
  defineHandler(async (req) => {
    const { id: userId } = req.user!;
    const post_id = req.params.post_id.toString();

    const post = await PostModel.findOne({
      _id: post_id,
      $or: [{ isPublic: true }, { isPublic: false, user: userId }]
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

    const like = await LikeModel.findOne({ user: userId, post: post?._id });

    const formattedPost = {
      ...post,
      isLikedByViewer: !!like
    };

    return {
      post: formattedPost
    };
  })
);

/**
 * @api {get} /community/posts/:post_id
 * @par {post_id} @path The post ID
 * @desc Gets a post by its ID
 * @domain {Community}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "post": { ... }
 * }
 * @use {Query}
 */
