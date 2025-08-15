import { userRepository } from "#src/db/repositories/user.repository";
import { z } from "zod";
import { getOtp, validateOtp } from "../services/otp.service";
import { TokenType } from "#src/db/models/token.model";
import { sendMail } from "#src/lib/email/email";
import { OTP_EXPIRY_TIME } from "#src/utils/constants";
import { pick } from "#src/utils/helpers";
import { compare } from "bcrypt";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";

const Schema_1 = z.object({
  email: z.string({ message: "Email is required" }).email({ message: "Invalid email" })
});
/**
 *
 * @api {post} /auth/recovery/send-otp
 * @domain Authentication
 * @desc Send OTP to verify user's account exists
 * @header {Content-Type} application/json
 * @body {json} { "email": "user@email.com" }
 * @res {json}
 * {
 *  "success": true,
 *  "message": "OTP sent to email successfully.",
 *  "user": {
 *    "_id": "string",
 *    "email": "string",
 *    "name": "string"
 *  }
 * }
 */

export const sendAccountRecoveryOtp = defineApi(
  {
    group: "/auth",
    path: "/recovery/send-otp",
    method: "post",
    middleware: defineValidator("body", Schema_1)
  },
  defineHandler(async (req) => {
    const { email } = req.validatedBody as z.infer<typeof Schema_1>;
    const user = await userRepository.findOne({ email });
    if (!user) {
      throw HttpException.notFound("Account not found.");
    }
    const token = await getOtp(user._id, TokenType.AccountRecovery);

    sendMail({
      to: `${user.name}<${user.email}>`,
      subject: "Account Recovery",
      text: `Your OTP is ${token}.\nNote: OTP expires in ${OTP_EXPIRY_TIME}`
    });

    return {
      success: true,
      message: "OTP sent to email successfully.",
      user: {
        ...pick(user, ["_id", "email", "name"])
      }
    };
  })
);

const Schema_2 = z.object({
  email: z.string({ message: "Email is required" }),
  otp: z.string({ message: "OTP is required" })
});
/**
 *
 * @api {post} /auth/recovery/verify-otp
 * @domain Authentication
 * @desc Verify the account recovery OTP
 * @header {Content-Type} application/json
 * @body {json} { "email": "user@email.com", "otp": "12345  6" }
 * @res {json}
 * {
 *  "success": true,
 *  "message": "OTP verified successfully.",
 *  "user": {
 *    "_id": "string",
 *    "email": "string",
 *    "name": "string"
 *  }
 * }
 */
export const verifyAccountRecoveryOTP = defineApi(
  {
    group: "/auth",
    path: "/recovery/verify-otp",
    method: "post",
    middleware: defineValidator("body", Schema_2)
  },
  defineHandler(async (req) => {
    const { email, otp } = req.validatedBody as z.infer<typeof Schema_2>;
    const user = await userRepository.findOne({ email });
    if (!user) {
      throw HttpException.notFound("Account not found.");
    }
    const isValid = await validateOtp(user._id, otp, TokenType.AccountRecovery);
    if (!isValid) {
      throw HttpException.badRequest("Invalid or expired OTP.");
    }
    return {
      success: true,
      message: "OTP verified successfully.",
      user: {
        ...pick(user, ["_id", "email", "name"])
      }
    };
  })
);

const Schema_3 = z
  .object({
    email: z.string({ message: "Email is required" }),
    password: z
      .string({ message: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" })
      .refine((p) => /[a-z]/.test(p), {
        message: "Password must contain at least one lowercase letter"
      })
      .refine((p) => /[A-Z]/.test(p), {
        message: "Password must contain at least one uppercase letter"
      })
      .refine((p) => /\d/.test(p), {
        message: "Password must contain at least one number"
      }),
    confirmPassword: z.string({ message: "Confirm Password is required" })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"]
  });

/**
 *
 * @api {post} /auth/recovery/reset-password
 * @domain Authentication
 * @desc Reset user's password
 * @header {Content-Type} application/json
 * @body {json} { "email": "user@email.com", "password": "password123", "confirmPassword": "password123" }
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Password reset successfully."
 * }
 */
export const resetPassword = defineApi(
  {
    group: "/auth",
    path: "/recovery/reset-password",
    method: "post",
    middleware: defineValidator("body", Schema_3)
  },
  defineHandler(async (req) => {
    const { email, password } = req.validatedBody;

    const user = await userRepository.findOne(
      { email },
      { select: ["password", "passwordHistory"] }
    );
    if (!user) {
      throw HttpException.notFound("Account not found.");
    }

    let history = user.passwordHistory || [];

    if (history.length) {
      let reused = false;
      for (const { password: previousPassword } of history) {
        const match = await compare(password, previousPassword);
        if (match) {
          reused = true;
          break;
        }
      }
      if (reused) {
        throw HttpException.badRequest("You cannot use a password you have used before.");
      }
    }

    history.unshift({ password: user.password, lastUsed: new Date() });
    history = history.slice(0, 20);

    await userRepository.updateOne(user._id, { password, passwordHistory: history });

    return {
      success: true,
      message: "Password reset successfully."
    };
  })
);
