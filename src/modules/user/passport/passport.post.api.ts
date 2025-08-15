import { PassportZodSchema, PassportZodType } from "#src/db/models/passport.model";
import { passportRepository } from "#src/db/repositories/passport.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";

export default defineApi(
  {
    group: "/users/me",
    path: "/passport",
    method: "post",
    middleware: defineValidator("body", PassportZodSchema)
  },
  defineHandler(async (req, res) => {
    const data = req.validatedBody as PassportZodType;

    const passport = await passportRepository.create(data);

    res.statusCode = 201;

    return {
      passport
    };
  })
);

/**
 * @api {post} /users/me/passport
 * @desc Creates new passport data
 * @domain {User: Passport}
 * @use {ContentAuth}
 * @body {json}
 * {
 *  "user": "string";
    "passportNumber": "string";
    "passportType": "PassportType";
    "fullName": "string";
    "nationality": "string";
    "issueDate": "Date";
    "expiryDate": "Date";
    "placeOfIssue?": "string | null | undefined";
 * }
 * @res {json}
 * {  
 *   "success": true,
 *   "passport": { ... }
 * }
 */
