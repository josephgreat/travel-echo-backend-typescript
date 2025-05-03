import { JWTPayload } from "#src/config/passport.config";
import { userRepository } from "#src/db/repositories/user.repository";
import { api } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import {
  errorCodes,
  JWT_LOGIN_SESSION_DURATION,
  MAXIMUM_PASSWORD_LENGTH,
  MINIMUM_PASSWORD_LENGTH
} from "#src/utils/constants";
import { omit, signJWT } from "#src/utils/helpers";
import { compare } from "bcrypt";
import { z } from "zod";

const Schema = z.object(
  {
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email" }),
    password: z
      .string({ message: "Password is required" })
      .min(MINIMUM_PASSWORD_LENGTH, {
        message: `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters long`
      })
      .max(MAXIMUM_PASSWORD_LENGTH, {
        message: `Password must be at most ${MAXIMUM_PASSWORD_LENGTH} characters long`
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
 * @res {json}  { "success": true, "message": "string", "user": {...} }
 */
export default api(
  {
    group: "/auth",
    path: "/login",
    method: "post",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const { email, password } = req.validatedBody as z.infer<typeof Schema>;

    const user = await userRepository.findOne({ email }, { select: ["verified", "password"] });

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
        token
      }
    };
  })
);
