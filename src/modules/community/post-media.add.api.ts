import { PostMedia, PostMediaModel } from "#src/db/models/post-media.model";
import { PostModel } from "#src/db/models/post.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import {
  CLOUDINARY_POST_MEDIA_FOLDER,
  MAX_POST_MEDIA,
  MAX_POST_MEDIA_SIZE,
  POST_MEDIA_PUBLIC_ID_PREFIX
} from "#src/utils/constants";
import { Formstream } from "#src/utils/formstream";
import { randomString } from "#src/utils/helpers";
import mongoose from "mongoose";
import cloudinary from "cloudinary";

/**
 * @api {put} /community/posts/:post_id/media/add
 * @par {post_id} @path The post ID
 * @desc Adds some media to the specified post
 * @domain {Community}
 * @use {Auth}
 * @body {FormData}
 * @res {json}
 * {
 *   "success": true,
 *   "files": {
 *      "uploaded": "number",
 *      "errored": "number"
 *    }
 * }
 */
export default defineApi(
  {
    group: "/community",
    path: "/posts/:post_id/media/add",
    method: "put"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;
    const postId = req.params.postId;

    const post = await PostModel.findOne({
      _id: postId,
      user: userId
    });

    if (!post) {
      throw HttpException.notFound("Post not found");
    }

    const amount = await PostMediaModel.countDocuments({
      post: postId,
      user: userId
    });

    const formstream = new Formstream({
      headers: req.headers,
      limits: { files: MAX_POST_MEDIA - amount, fileSize: MAX_POST_MEDIA_SIZE }
    });

    const { data, error } = await formstream.execute(req, async ({ file }) => {
      const mediaPublicId = `${POST_MEDIA_PUBLIC_ID_PREFIX}${postId.toString()}_${randomString(16, "numeric")}`;

      return new Promise<PostMedia & { _id: mongoose.Types.ObjectId }>(
        (resolve, reject) => {
          const stream = cloudinary.v2.uploader.upload_stream(
            {
              asset_folder: `${CLOUDINARY_POST_MEDIA_FOLDER}/${postId.toString()}`,
              public_id: mediaPublicId,
              display_name: mediaPublicId,
              unique_filename: true
            },
            (error, result) => {
              if (error) return reject(error);

              if (result) {
                resolve({
                  _id: new mongoose.Types.ObjectId(),
                  url: result.secure_url,
                  name: result.display_name,
                  publicId: result.public_id,
                  assetId: result.asset_id,
                  format: result.format,
                  bytes: result.bytes,
                  user: userId,
                  post: post._id
                });
              } else {
                reject(new Error("No result from Cloudinary"));
              }
            }
          );

          file.pipe(stream);
        }
      );
    });

    if (error) {
      throw HttpException.badRequest(error.message);
    }

    const { files } = data;

    const { uploadedFiles, erroredFiles } = files.reduce(
      (acc, file) => {
        if (file.error) {
          acc.erroredFiles.push(file);
        } else {
          acc.uploadedFiles.push(file);
        }
        return acc;
      },
      { uploadedFiles: [] as typeof files, erroredFiles: [] as typeof files }
    );

    await Promise.all([
      post.updateOne({ isEdited: true }),
      PostMediaModel.create(
        uploadedFiles.map((file) => ({
          user: userId,
          post: postId,
          ...file.data
        }))
      )
    ]);

    return {
      files: {
        uploaded: uploadedFiles.length,
        errored: erroredFiles.length
      }
    };
  })
);
