import { profileRepository } from "#src/db/repositories/profile.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

/**
 * @api {get} /users/me/profile
 * @desc Get user profile. This endpoint will also create a minimal profile if the profile doesn't already exist
 * @domain {User: Profile}
 * @use {Auth}
 * @res {json} { "success": true, "profile": {...} }
 */
export const getProfile = defineApi(
  { group: "/users/me", path: "/profile", method: "get" },
  defineHandler(async (req) => {
    const id = req.user?.id;

    const profile = await profileRepository.findOne({ user: id });

    return { profile };
  })
);
