import { profileRepository } from "#src/db/repositories/profile.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import cloudinary from "cloudinary";

/**
 * @api {delete} /users/me/profile/image
 * @domain {User: Profile}
 * @desc Remove the user's profile image
 * @use {Auth}
 * @res {json} { "success": true, "message": "Profile image removed successfully" }
 */
export default defineApi(
  {
    group: "/users/me",
    path: "/profile/image",
    method: "delete"
  },
  defineHandler(async (req) => {
    const { id } = req.user!;

    const profile = await profileRepository.findOrCreate({ user: id }, { user: id });

    const { image } = profile;
    if (!image) {
      return HttpException.notFound("No profile image set");
    }

    try {
      await cloudinary.v2.uploader.destroy(image.publicId, { invalidate: true });
    } catch (error) {
      throw HttpException.internal(`Failed to delete image: ${(error as Error).message}`);
    }

    await profileRepository.updateOne(profile._id, { image: undefined });

    return {
      success: true,
      message: "Profile image removed succesfully"
    };
  })
);
