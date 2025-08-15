import { passportRepository } from "#src/db/repositories/passport.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import cloudinary from "cloudinary";
import { CLOUDINARY_PASSPORT_IMAGES_FOLDER } from "#src/utils/constants";

/**
 * @api {delete} /users/me/passport/image
 * @domain {User: Passport}
 * @desc Deletes the passport image
 * @use {Auth}
 * @res {json} { "success": true, "message": "Passport image deleted successfully" }
 */
export default defineApi(
  {
    group: "/users/me",
    path: "/passport/image",
    method: "delete"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;

    const passport = await passportRepository.findOne({ user: userId });

    if (!passport) {
      throw HttpException.notFound("Passport data not found");
    }

    const { image } = passport;

    if (!image) {
      return HttpException.notFound("No previous passport image");
    }

    try {
      await cloudinary.v2.uploader.destroy(image.publicId, { invalidate: true });
      await Promise.all([
        cloudinary.v2.api.delete_folder(
          `${CLOUDINARY_PASSPORT_IMAGES_FOLDER}/${passport._id.toString()}`
        ),
        passportRepository.updateOne({ _id: passport._id, user: userId }, { image: undefined })
      ]);

      return {
        success: true,
        message: "Passport image deleted succesfully"
      };
    } catch (error) {
      throw HttpException.internal(`Failed to delete image: ${(error as Error).message}`);
    }
  })
);
