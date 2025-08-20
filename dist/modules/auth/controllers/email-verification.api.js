"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOtpAndVerifyAccount = exports.sendEmailVerificationOtp = void 0;
const user_repository_1 = require("#src/db/repositories/user.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const zod_1 = require("zod");
const otp_service_1 = require("../services/otp.service");
const email_1 = require("#src/lib/email/email");
const token_model_1 = require("#src/db/models/token.model");
const constants_1 = require("#src/utils/constants");
const Schema_1 = zod_1.z.object({
    email: zod_1.z.string({ message: "Email is required" }).email({ message: "Invalid email" })
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
exports.sendEmailVerificationOtp = (0, api_1.defineApi)({
    group: "/auth",
    path: "/verification/send-otp",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", Schema_1)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { email } = req.validatedBody;
    const user = await user_repository_1.userRepository.findOne({ email });
    if (!user) {
        throw http_1.HttpException.notFound("Account not found.");
    }
    if (user.verified) {
        throw http_1.HttpException.badRequest("Account already verified.");
    }
    const token = await (0, otp_service_1.getOtp)(user._id, token_model_1.TokenType.EmailVerification);
    await (0, email_1.sendMail)({
        to: `${user.name}<${user.email}>`,
        subject: "Account Verification",
        text: `Your OTP is ${token}.\nNote: OTP expires in ${constants_1.OTP_EXPIRY_TIME}`
    });
    return {
        success: true,
        message: "OTP sent to email successfully."
    };
}));
const Schema_2 = zod_1.z.object({
    email: zod_1.z.string({ message: "Email is required" }).email({ message: "Invalid email" }),
    otp: zod_1.z.string({ message: "OTP is required" })
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
exports.validateOtpAndVerifyAccount = (0, api_1.defineApi)({
    group: "/auth",
    path: "/verification/verify",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", Schema_2)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { email, otp } = req.validatedBody;
    const user = await user_repository_1.userRepository.findOne({ email });
    if (!user) {
        throw http_1.HttpException.notFound("Account not found.");
    }
    const isMatch = await (0, otp_service_1.validateOtp)(user._id, otp, token_model_1.TokenType.EmailVerification);
    if (!isMatch) {
        throw http_1.HttpException.badRequest("Invalid or expired OTP.");
    }
    await user_repository_1.userRepository.updateOne(user._id, { verified: true });
    return {
        success: true,
        message: "Account verified successfully."
    };
}));
