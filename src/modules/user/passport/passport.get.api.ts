import { passportRepository } from "#src/db/repositories/passport.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";

export default defineApi(
  {
    group: "/users/me",
    path: "/passport",
    method: "get"
  },
  defineHandler(async (req) => {
    const id = req.user!.id;

    const passport = await passportRepository.findOne({
      user: id
    });

    if (!passport) {
      throw HttpException.notFound("Passport data not found");
    }

    return {
      success: true,
      passport
    };
  })
);

/**
 * @api {get} /users/me/passport
 * @desc Gets the user's passport information
 * @domain {User: Passport}
 * @use {Auth}
 * @res {json} { "success": true, "passport": {...} }
 */
