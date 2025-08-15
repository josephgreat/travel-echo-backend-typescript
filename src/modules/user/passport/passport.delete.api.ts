import { passportRepository } from "#src/db/repositories/passport.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";

export default defineApi(
  {
    group: "/users/me",
    path: "/passport/:passportId",
    method: "delete"
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;
    const { passportId } = req.params;

    if (!passportId) {
      throw HttpException.badRequest("Passport ID is required");
    }

    const result = await passportRepository.deleteOne({
      _id: passportId,
      user: userId
    });

    if (result.deletedCount === 0) {
      throw HttpException.notFound("Passport not found or you do not have permission to delete it");
    }

    return {
      success: true,
      message: "Passport deleted successfully"
    };
  })
);

/**
 * @api {delete} /users/me/passport/:passportId
 * @desc Deletes a specific passport of the authenticated user by ID
 * @domain {User: Passport}
 * @use {Auth}
 * @param {String} passportId
 * @res {json} { "success": true, "message": "Passport deleted successfully" }
 */
