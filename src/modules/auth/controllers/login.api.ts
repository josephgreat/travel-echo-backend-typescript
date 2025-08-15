import { JWTPayload } from "#src/config/passport.config";
import { userRepository } from "#src/db/repositories/user.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import {
  errorCodes,
  JWT_LOGIN_SESSION_DURATION,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH
} from "#src/utils/constants";
import { omit, signJWT } from "#src/utils/helpers";
import { compare } from "bcrypt";
import { z } from "zod";

const Schema = z.object(
  {
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email" }),
    password: z
      .string({ message: "Password is required" })
      .min(MIN_PASSWORD_LENGTH, {
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
      })
      .max(MAX_PASSWORD_LENGTH, {
        message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters long`
      })
  },
  { message: "Request body is invalid" }
);

/**
 *
 * @api {post} /auth/login
 * @domain Authentication
 * @desc Login
 * @header {Content-Type} application/json
 * @body {json} { "email": "string", "password": "string" }
 * @resDesc ```Profile``` may have only the ```user``` field present if the user has not updated their profile.
 * ```Subscription```  may be ```null``` or not present if the user has not subscribed to a plan before.
 * @res {json}
 * {
 * "success": true,
 * "message": "Login successful",
 * "user": {
 *    "_id": "681630ca7fb1cb66d20f141f",
 *    "name": "John Doe",
 *    "email": "user@email.com",
 *    "verified": true,
 *    "role": "USER",
 *    "plan": "FREE",
 *    "profile": {
 *      "_id": "681630ca7fb1cb66d20f141f",
 *      "dateOfBirth": "2000-01-01",
 *      "image": {
 *        "url": "https://example.com/image.jpg",
 *        "name": "image.jpg",
 *        "publicId": "image.jpg",
 *        "assetId": "63545234234344",
 *        "format": "jpg",
 *        "bytes": 67541
 *       },
 *      "gender": "MALE",
 *      "languages": ["English", "French", "Yoruba"],
 *      "interests": ["Swimming", "Travelling"],
 *      "location": "Abuja, Nigeria",
 *      "school": {
 *        "name": "FullBright Academy",
 *        "country": "Nigeria"
 *      },
 *      "occupation": "student"
 *    },
 *    "subscription": {
 *      "_id": "681630ca7fb1cb66d20f141f",
 *      "type": "FREE",
 *      "createdAt": "2025-05-03T17:02:40.000Z",
 *      "expiresAt": "2025-05-03T17:02:40.000Z"
 *    },
 * "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODE2MzBjYTdmYjFjYjY2ZDIwZjE0MWYiLCJlbWFpbCI6Im5hdGhhbjQ0d2lsc29uQGdtYWlsLmNvbSIsImlhdCI6MTc0NjI4NzkyNiwiZXhwIjoxNzQ4ODc5OTI2fQ.j5XqC-Nlyt9FfFAbLVpW4gHxYmEdW4WMeYCewvzqp04"
 *  }
 * }
 */
export default defineApi(
  {
    group: "/auth",
    path: "/login",
    method: "post",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const { email, password } = req.validatedBody as z.infer<typeof Schema>;

    const user = await userRepository.findOne(
      { email },
      {
        include: ["password", "passwordHistory"],
        populate: ["profile", "subscription"]
      }
    );

    if (!user) {
      throw new HttpException(401, "Invalid email or password.");
    }
    if (!user.verified) {
      throw new HttpException(402, "Email is not verified.", {
        errorCode: errorCodes.EMAIL_NOT_VERIFIED
      });
    }
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      throw new HttpException(401, "Invalid email or password.");
    }
    const token = signJWT<JWTPayload>(
      { userId: user._id.toString(), email: user.email },
      { expiresIn: JWT_LOGIN_SESSION_DURATION }
    );

    return {
      message: "Login successful",
      user: {
        ...omit(user, ["password", "passwordHistory"]),
        subscription: user.subscription || null,
        token
      }
    };
  })
);
