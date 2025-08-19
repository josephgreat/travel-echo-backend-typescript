import { LikeModel, LikeTarget } from "#src/db/models/like.model";
import { PostModel } from "#src/db/models/post.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";

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
        //options: { limit: 4 }
      })
      .lean()
      .exec();

    if (!post) {
      throw HttpException.notFound("Post not found.");
    }

    const like = await LikeModel.findOne({ user: userId, post: post?._id, target: LikeTarget.Post });

    const formattedPost = {
      ...post,
      author: {
        _id: post.user._id,
        // @ts-expect-error population
        name: post.user.name,
        // @ts-expect-error population
        image: post.user.profile.image?.url ?? null,
        // @ts-expect-error population
        profileId: post.user.profile._id
      },
      isLikedByViewer: !!like,
      isViewedByAuthor: userId.toString() === post.user._id.toString(),
      user: undefined
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
 */
