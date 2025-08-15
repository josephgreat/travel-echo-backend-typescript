import { PassportZodSchema, PassportZodType } from "#src/db/models/passport.model";
import { passportRepository } from "#src/db/repositories/passport.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { castToObjectId } from "#src/utils/helpers";

export default defineApi(
  {
    group: "/users/me",
    path: "/passport",
    method: "put",
    middleware: defineValidator("body", PassportZodSchema)
  },
  defineHandler(async (req) => {
    const userId = req.user!.id;
    const data = req.validatedBody as PassportZodType;

    data.user = castToObjectId(userId);

    const passport = await passportRepository.updateOne({ user: userId }, data);

    if (!passport) {
      throw HttpException.notFound("Passport data not found");
    }

    return {
      passport
    };
  })
);

/**
 * @api {put} /users/me/passport
 * @desc Updates the user's passport data
 * @domain {User: Passport}
 * @use {ContentAuth}
 * @body {json}
 * {
 *  "user": "string",
    "passportNumber": "string",
    "passportType": "PassportType",
    "fullName": "string",
    "nationality": "string",
    "issueDate": "Date",
    "expiryDate": "Date",
    "placeOfIssue?": "string | null | undefined"
 * }
 * @res {json}
 * {  
 *   "success": true,
 *   "passport": { ... }
 * }
 */
