import { CloudinaryImage } from "#src/db/models/models";
import { passportRepository } from "#src/db/repositories/passport.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import {
  CLOUDINARY_PASSPORT_IMAGES_FOLDER,
  MAX_PASSPORT_IMAGE_SIZE,
  PASSPORT_IMAGE_PUBLIC_ID_PREFIX
} from "#src/utils/constants";
import { Formstream } from "#src/utils/formstream";
import { randomString } from "#src/utils/helpers";
import cloudinary from "cloudinary";

export default defineApi(
  {
    group: "/users/me",
    path: "/passport/:passportId/images",
    method: "put"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;
    const { passportId } = req.params;
    const passport = await passportRepository.findOne({
      _id: passportId,
      user: userId
    });

    if (!passport) {
      throw HttpException.notFound("Passport data not found");
    }

    const formstream = new Formstream({
      headers: req.headers,
      limits: {
        fileSize: MAX_PASSPORT_IMAGE_SIZE
      }
    });

    const { data, error } = await formstream.execute(req, async ({ file }) => {
      const imagePublicId = PASSPORT_IMAGE_PUBLIC_ID_PREFIX.concat(
        passport._id.toString()
      ).concat(`_${randomString(16, "numeric")}`);

      return new Promise<CloudinaryImage>((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            asset_folder: `${CLOUDINARY_PASSPORT_IMAGES_FOLDER}/${passportId}`,
            public_id: imagePublicId,
            display_name: imagePublicId,
            unique_filename: true
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("No result from Cloudinary"));

            resolve({
              url: result.secure_url,
              name: result.display_name,
              publicId: result.public_id,
              assetId: result.asset_id,
              format: result.format,
              bytes: result.bytes
            });
          }
        );
        file.pipe(stream);
      });
    });

    if (error) {
      throw HttpException.internal(`Upload failed: ${error.message}`);
    }

    const { files } = data;

    // 6️⃣ Delete existing images from Cloudinary
    if (passport.images && passport.images.length > 0) {
      for (const oldImage of passport.images) {
        if (oldImage?.publicId) {
          await cloudinary.v2.uploader.destroy(oldImage.publicId, {
            invalidate: true
          });
        }
      }
    }

    // 7️⃣ Replace images in DB
    const updatedPassport = await passportRepository.updateOne(passport._id, {
      images: files.map((file) => file.data).filter((file) => !!file)
    });

    if (!updatedPassport) {
      throw HttpException.internal("Failed to update passport images");
    }

    // 8️⃣ Return result
    return {
      images: updatedPassport.images
    };
  })
);

/**
 * @api {put} /users/me/passport/:passportId/images
 * @desc Upload multiple passport images (replaces old ones)
 * @domain {User: Passport}
 * @use {Auth}
 * @body {FormData} Form Data (field: passportImages[])
 * @res {json}
 * {
 *  "success": true,
 *  "images": [
 *    {
 *      "url": "...",
 *      "name": "...",
 *      "publicId": "...",
 *      ...
 *    }
 *  ]
 * }
 */
