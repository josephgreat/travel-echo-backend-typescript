import { CommentModel } from "#src/db/models/comment.model";
import { LikeModel } from "#src/db/models/like.model";
import { MilestoneModel } from "#src/db/models/milestone.model";
import { PostMediaModel } from "#src/db/models/post-media.model";
import { PostModel } from "#src/db/models/post.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { CLOUDINARY_POST_MEDIA_FOLDER } from "#src/utils/constants";
import logger from "#src/utils/logger";
import cloudinary from "cloudinary";

/**
 * @api {delete} /community/posts/:post_id
 * @par {post_id} @path The post ID
 * @desc Deletes the post with the provided ID
 * @domain {Community}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "deleted": "true"
 * }
 */

export default defineApi(
  {
    group: "/community",
    path: "/posts/:post_id",
    method: "delete"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;
    const postId = req.params.post_id;

    const post = await PostModel.findById(postId);

    if (!post) {
      throw HttpException.notFound("Post not found");
    }

    // Authorization check
    if (post.user.toString() !== userId.toString()) {
      throw HttpException.forbidden("Not allowed");
    }

    // Get media before deletion for cleanup
    const media = await PostMediaModel.find({ post: postId });
    const publicIds = media.map((m) => m.publicId);

    // Database operations (critical path)
    const dbPromises: Promise<unknown>[] = [
      post.deleteOne(),
      PostMediaModel.deleteMany({ post: postId }),
      CommentModel.deleteMany({ post: postId }),
      LikeModel.deleteMany({ post: postId }),
      MilestoneModel.updateOne({ user: userId }, { $inc: { totalPosts: -1 } })
    ];

    if (post.repostedPost) {
      dbPromises.push(
        PostModel.updateOne(
          { _id: post.repostedPost },
          { $inc: { repostCount: -1 } }
        )
      );
    }

    // Execute DB operations first
    await Promise.all(dbPromises);

    // Cloudinary cleanup (non-critical, can fail without affecting DB)
    if (publicIds.length > 0) {
      try {
        await cloudinary.v2.api.delete_resources(publicIds, {
          invalidate: true
        });
        await cloudinary.v2.api.delete_folder(
          `${CLOUDINARY_POST_MEDIA_FOLDER}/${postId}`
        );
      } catch (cloudinaryError) {
        logger.error(
          "Cloudinary cleanup failed: ",
          cloudinaryError instanceof Error
            ? cloudinaryError
            : new Error(String(cloudinaryError))
        );
      }
    }

    return {
      deleted: true
    };
  })
);

// delete post
// delete post media
// if post is reposting update repost count on reposted post
// update totalPosts milestone for user
// delete all post comments
// delete all post likes
// delete all comment likes
