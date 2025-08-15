import { passportRepository } from "#src/db/repositories/passport.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";

export default defineApi(
  {
    group: "/users/me",
    path: "passport",
    method: "delete"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;
    const result = await passportRepository.deleteOne({ user: userId });

    if (result.deletedCount === 0) {
      throw HttpException.notFound("Passport data not found");
    }

    return {
      message: "Passport data deleted successfully"
    };
  })
);

/**
 * @api {delete} /users/me/passport
 * @desc Deletes the user's passport information
 * @domain {User: Passport}
 * @use {Auth}
 * @res {json} { "success": true, "message": "Passport data deleted successfully" }
 */
