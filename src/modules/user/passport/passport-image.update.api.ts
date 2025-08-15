import { CloudinaryImage } from "#src/db/models/models";
import { passportRepository } from "#src/db/repositories/passport.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { AsyncBusboy } from "#src/utils/async-busboy";
import {
  CLOUDINARY_PASSPORT_IMAGES_FOLDER,
  MAX_PASSPORT_IMAGE_SIZE,
  PASSPORT_IMAGE_PUBLIC_ID_PREFIX
} from "#src/utils/constants";
import { randomString } from "#src/utils/helpers";
import cloudinary from "cloudinary";

export default defineApi(
  {
    group: "/users/me",
    path: "/passport/image",
    method: "patch"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;

    const passport = await passportRepository.findOne({ user: userId });

    if (!passport) {
      throw HttpException.notFound("Passport data not found");
    }

    const uploader = new AsyncBusboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_PASSPORT_IMAGE_SIZE
      }
    });

    uploader.handler(async (name, file) => {
      const imagePublicId = PASSPORT_IMAGE_PUBLIC_ID_PREFIX.concat(passport._id.toString()).concat(
        `_${randomString(16, "numeric")}`
      );

      return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            asset_folder: `${CLOUDINARY_PASSPORT_IMAGES_FOLDER}/${passport._id.toString()}`,
            public_id: imagePublicId,
            display_name: imagePublicId,
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
                bytes: result.bytes
              });
            } else {
              reject(new Error("No result from Cloudinary"));
            }
          }
        );

        file.pipe(stream);
      });
    });

    const { error, data } = await uploader.upload<CloudinaryImage>(req);

    if (!data || !data[0].data || error) {
      throw HttpException.badRequest(error?.message || "Upload failed");
    }

    if (passport.image) {
      await cloudinary.v2.uploader.destroy(passport.image.publicId, { invalidate: true });
    }

    const updatedPassport = await passportRepository.updateOne(passport._id, {
      image: data[0].data
    });

    if (!updatedPassport) {
      throw HttpException.internal("Failed to update passport image: Passport data not found");
    }

    return {
      image: updatedPassport.image
    };
  })
);

/**
 * @api {put} /users/me/passport/image
 * @desc Uploads the passport image
 * @domain {User: Passport}
 * @use {Auth}
 * @body {FormData} Form Data
 * @res {json}
 * {
 *  "success": true,
 *  "image": {
 *    "url": "https://res.cloudinary.com/...IMG_PASS_68122116ecccbf17300a8829.png",
 *    "name": "IMG_PASS_68122116ecccbf17300a8829",
 *    "publicId": "IMG_PASS_68122116ecccbf17300a8829",
 *    "assetId": "63545234234344",
 *    "format": "jpg",
 *    "bytes": 67541
 *   }
 * }
 */
