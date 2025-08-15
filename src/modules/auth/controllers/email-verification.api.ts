import { userRepository } from "#src/db/repositories/user.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { z } from "zod";
import { getOtp, validateOtp } from "../services/otp.service";
import { sendMail } from "#src/lib/email/email";
import { TokenType } from "#src/db/models/token.model";
import { OTP_EXPIRY_TIME } from "#src/utils/constants";

const Schema_1 = z.object({
  email: z.string({ message: "Email is required" }).email({ message: "Invalid email" })
});

/**
 *
 * @api {post} /auth/verification/send-otp
 * @domain Authentication
 * @desc Send OTP to verify user's email
 * @header {Content-Type} application/json
 * @body {json} { "email": "string" }
 * @res {json}  { "success": true, "message": "OTP sent to email successfully." }
 */
export const sendEmailVerificationOtp = defineApi(
  {
    group: "/auth",
    path: "/verification/send-otp",
    method: "post",
    middleware: defineValidator("body", Schema_1)
  },
  defineHandler(async (req) => {
    const { email } = req.validatedBody as z.infer<typeof Schema_1>;

    const user = await userRepository.findOne({ email });
    if (!user) {
      throw HttpException.notFound("Account not found.");
    }
    if (user.verified) {
      throw HttpException.badRequest("Account already verified.");
    }
    const token = await getOtp(user._id, TokenType.EmailVerification);

    await sendMail({
      to: `${user.name}<${user.email}>`,
      subject: "Account Verification",
      text: `Your OTP is ${token}.\nNote: OTP expires in ${OTP_EXPIRY_TIME}`
    });

    return {
      success: true,
      message: "OTP sent to email successfully."
    };
  })
);

const Schema_2 = z.object({
  email: z.string({ message: "Email is required" }).email({ message: "Invalid email" }),
  otp: z.string({ message: "OTP is required" })
});
/**
 *
 * @api {post} /auth/verification/verify
 * @domain Authentication
 * @desc Verify user's email
 * @header {Content-Type} application/json
 * @body {json} { "email": "user@email.com", "otp": "123456" }
 * @res {json}  { "success": true, "message": "Account verified successfully." }
 */
export const validateOtpAndVerifyAccount = defineApi(
  {
    group: "/auth",
    path: "/verification/verify",
    method: "post",
    middleware: defineValidator("body", Schema_2)
  },
  defineHandler(async (req) => {
    const { email, otp } = req.validatedBody as z.infer<typeof Schema_2>;
    const user = await userRepository.findOne({ email });
    if (!user) {
      throw HttpException.notFound("Account not found.");
    }
    const isMatch = await validateOtp(user._id, otp, TokenType.EmailVerification);
    if (!isMatch) {
      throw HttpException.badRequest("Invalid or expired OTP.");
    }
    await userRepository.updateOne(user._id, { verified: true });

    return {
      success: true,
      message: "Account verified successfully."
    };
  })
);
