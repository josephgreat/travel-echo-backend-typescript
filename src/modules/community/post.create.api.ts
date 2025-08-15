import { PostMedia, PostMediaModel } from "#src/db/models/post-media.model";
import { PostModel, postSchema } from "#src/db/models/post.model";
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

export default defineApi(
  {
    path: "/posts",
    group: "/community",
    method: "post"
  },
  defineHandler(async (req) => {
    const { id: userId } = req.user!;
    const postId = new mongoose.Types.ObjectId();

    const formstream = new Formstream({
      headers: req.headers,
      limits: { files: MAX_POST_MEDIA, fileSize: MAX_POST_MEDIA_SIZE }
    });

    const { data, error } = await formstream.execute(req, async ({ file }) => {
      const mediaPublicId = `${POST_MEDIA_PUBLIC_ID_PREFIX}${postId.toString()}_${randomString(16, "numeric")}`;

      return new Promise<PostMedia>((resolve, reject) => {
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
                url: result.secure_url,
                name: result.display_name,
                publicId: result.public_id,
                assetId: result.asset_id,
                format: result.format,
                bytes: result.bytes,
                user: userId,
                post: postId
              });
            } else {
              reject(new Error("No result from Cloudinary"));
            }
          }
        );

        file.pipe(stream);
      });
    });

    if (error) {
      throw HttpException.badRequest(error.message);
    }

    const { fields, files } = data;

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

    const post: Record<string, string> = fields.reduce((acc, field) => {
      const object: Record<string, string> = {};
      object[field.name] = field.value;
      acc = { ...acc, ...object };
      return acc;
    }, {});

    const result = postSchema.safeParse(post);

    if (!result.success) {
      // delete images
      const publicIds = uploadedFiles
        .map((file) => file.data?.publicId)
        .filter((val) => typeof val === "string");

      await cloudinary.v2.api.delete_resources(publicIds, { invalidate: true });

      throw HttpException.badRequest(result.error.issues[0].message);
    }

    const validated = result.data;

    const [createdPost] = await Promise.all([
      PostModel.create({ ...validated, _id: postId }),
      PostMediaModel.create(uploadedFiles.map((file) => ({ user: userId, post: postId, ...file })))
    ]);

    return {
      post: createdPost,
      media: {
        uploaded: uploadedFiles.length,
        errored: erroredFiles.length
      }
    };
  })
);

/**
 * @api {post} /community/posts
 * @desc Creates a post
 * @domain {Community}
 * @use {Auth}
 * @body {FormData}
 * @res {json}
 * {
 *   "success": true,
 *   "post": { ... },
 *   "media": {
 *    "uploaded": "number",
 *    "errored": "number"
 *   }
 * }
 * @use {Query}
 */
