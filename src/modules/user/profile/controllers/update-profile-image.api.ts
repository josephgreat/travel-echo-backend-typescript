import { ProfileImage } from "#src/db/models/profile.model";
import { profileRepository } from "#src/db/repositories/profile.repository";
import { api } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { MAX_PROFILE_IMAGE_SIZE } from "#src/utils/constants";
import { randomString } from "#src/utils/helpers";
import busboy from "busboy";
import cloudinary from "cloudinary";

interface FileInfo {
  exists: boolean;
  error: Error | null;
  isUploaded: boolean;
}

/**
 * @api {put} /users/me/profile/image
 * @domain {User: Profile}
 * @desc Update the user's profile image
 * @use {Auth}
 * @res {json}
 * {
 *  "success": true,
 *  "image": {
 *    "url": "https://res.cloudinary.com/...IMG_PRO_68122116ecccbf17300a8829.png",
 *    "name": "IMG_PRO_IMG_PRO_68122116ecccbf17300a8829",
 *    "publicId": "IMG_PRO_IMG_PRO_68122116ecccbf17300a8829",
 *    "assetId": "63545234234344",
 *    "format": "jpg",
 *    "bytes": 67541
 *   }
 * }
 */
export default api(
  {
    group: "/users/me",
    path: "/profile/image",
    method: "put"
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const profile = await profileRepository.findOrCreate({ user: id }, { user: id });
    let image: ProfileImage | null = null;
    // Create a promise to handle the file upload
    return new Promise((resolve, reject) => {
      const fileInfo: FileInfo = {
        exists: false,
        error: null,
        isUploaded: false
      };

      const imagePublicId = `IMG_PRO_${id.toString()}_${randomString(16, "numeric")}`;

      const bb = busboy({
        headers: req.headers,
        limits: {
          files: 1,
          fileSize: MAX_PROFILE_IMAGE_SIZE
        }
      });

      bb.on("file", (fileName, file) => {
        fileInfo.exists = true;

        const uploadPromise = new Promise<ProfileImage>((uploadResolve, uploadReject) => {
          const stream = cloudinary.v2.uploader.upload_stream(
            {
              asset_folder: "PROFILE_IMAGES",
              public_id: imagePublicId,
              display_name: imagePublicId,
              unique_filename: true
            },
            (error, result) => {
              if (error) {
                fileInfo.error = error;
                uploadReject(error);
                return;
              }

              if (result) {
                fileInfo.isUploaded = true;
                image = {
                  url: result.secure_url,
                  name: result.display_name,
                  publicId: result.public_id,
                  assetId: result.asset_id,
                  format: result.format,
                  bytes: result.bytes
                };
                uploadResolve(image);
              }
            }
          );

          file.pipe(stream);

          file.on("error", (err) => {
            fileInfo.error = err;
            uploadReject(err);
          });
        });

        uploadPromise
          .then(async () => {
            try {
              if (!image) {
                reject(HttpException.internal("No image returned after upload"));
                return;
              }

              if (profile.image) {
                await cloudinary.v2.uploader.destroy(profile.image.publicId, { invalidate: true });
                //await profileRepository.updateOne(profile._id, { image: undefined });
              }

              const updatedProfile = await profileRepository.updateOne(
                profile._id,
                { image },
                { returning: true }
              );

              resolve({
                success: true,
                image: updatedProfile?.image || image
              });
            } catch (err) {
              reject(err);
            }
          })
          .catch((err) => {
            reject(HttpException.badRequest("Failed to upload file: " + err.message));
          });
      });

      bb.on("error", (err) => {
        reject(HttpException.badRequest("Failed to upload file: " + (err as Error).message));
      });

      bb.on("finish", () => {
        if (!fileInfo.exists) {
          reject(HttpException.badRequest("No file uploaded"));
        }
      });

      req.pipe(bb);
    });
  })
);
