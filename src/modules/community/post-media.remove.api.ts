import { PostMediaModel } from "#src/db/models/post-media.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { z } from "zod";
import cloudinary from "cloudinary";
import { PostModel } from "#src/db/models/post.model";
import { HttpException } from "#src/lib/api/http";

const schema = z.object({
  media: z.array(
    z.object({
      id: z.string({ message: "Each media ID must be a string" }),
      publicId: z.string({ message: "Each media public ID must be a string" })
    })
  )
});

type Schema = z.infer<typeof schema>;

/**
 * @api {put} /community/posts/:post_id/media/remove
 * @par {post_id} @path The post ID
 * @desc Removes the specified post media
 * @domain {Community}
 * @use {Auth}
 * @bodyDesc {Payload must be an array of objects, each with object having the media id and the media public id}
 * @body {json}
 * {
 *   "media": [
 *     { "id": "id_1", "publicId": "public_id_1" },
 *     { "id": "id_2", "publicId": "public_id_2" },
 *     { "id": "id_3", "publicId": "public_id_3" }
 *   ]
 * }
 * @res {json}
 * {
 *   "success": true,
 *   "deleted": "number"
 * }
 */
export default defineApi(
  {
    group: "/community",
    path: "/posts/:post_id/media/remove",
    method: "put",
    middleware: defineValidator("body", schema)
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

    const { media } = req.validatedBody as Schema;
    const [mediaIds, mediaPublicIds] = media.reduce(
      (acc, m) => {
        acc[0].push(m.id);
        acc[1].push(m.publicId);

        return acc;
      },
      [[], []] as [string[], string[]]
    );

    await Promise.all([
      post.updateOne({
        $set: { isEdited: true },
        $pull: { media: { $in: mediaIds } }
      }),
      PostMediaModel.deleteMany({ _id: { $in: mediaIds }, post: post._id }),
      cloudinary.v2.api.delete_resources(mediaPublicIds, {
        invalidate: true
      })
    ]);

    return {
      deleted: media.length
    };
  })
);
