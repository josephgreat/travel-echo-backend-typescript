"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyAccountRecoveryOTP = exports.sendAccountRecoveryOtp = void 0;
const user_repository_1 = require("#src/db/repositories/user.repository");
const zod_1 = require("zod");
const otp_service_1 = require("../services/otp.service");
const token_model_1 = require("#src/db/models/token.model");
const email_1 = require("#src/lib/email/email");
const constants_1 = require("#src/utils/constants");
const helpers_1 = require("#src/utils/helpers");
const bcrypt_1 = require("bcrypt");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const Schema_1 = zod_1.z.object({
    email: zod_1.z.string({ message: "Email is required" }).email({ message: "Invalid email" })
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
exports.sendAccountRecoveryOtp = (0, api_1.defineApi)({
    group: "/auth",
    path: "/recovery/send-otp",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", Schema_1)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { email } = req.validatedBody;
    const user = await user_repository_1.userRepository.findOne({ email });
    if (!user) {
        throw http_1.HttpException.notFound("Account not found.");
    }
    const token = await (0, otp_service_1.getOtp)(user._id, token_model_1.TokenType.AccountRecovery);
    (0, email_1.sendMail)({
        to: `${user.name}<${user.email}>`,
        subject: "Account Recovery",
        text: `Your OTP is ${token}.\nNote: OTP expires in ${constants_1.OTP_EXPIRY_TIME}`
    });
    return {
        success: true,
        message: "OTP sent to email successfully.",
        user: {
            ...(0, helpers_1.pick)(user, ["_id", "email", "name"])
        }
    };
}));
const Schema_2 = zod_1.z.object({
    email: zod_1.z.string({ message: "Email is required" }),
    otp: zod_1.z.string({ message: "OTP is required" })
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
exports.verifyAccountRecoveryOTP = (0, api_1.defineApi)({
    group: "/auth",
    path: "/recovery/verify-otp",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", Schema_2)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { email, otp } = req.validatedBody;
    const user = await user_repository_1.userRepository.findOne({ email });
    if (!user) {
        throw http_1.HttpException.notFound("Account not found.");
    }
    const isValid = await (0, otp_service_1.validateOtp)(user._id, otp, token_model_1.TokenType.AccountRecovery);
    if (!isValid) {
        throw http_1.HttpException.badRequest("Invalid or expired OTP.");
    }
    return {
        success: true,
        message: "OTP verified successfully.",
        user: {
            ...(0, helpers_1.pick)(user, ["_id", "email", "name"])
        }
    };
}));
const Schema_3 = zod_1.z
    .object({
    email: zod_1.z.string({ message: "Email is required" }),
    password: zod_1.z
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
    confirmPassword: zod_1.z.string({ message: "Confirm Password is required" })
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
exports.resetPassword = (0, api_1.defineApi)({
    group: "/auth",
    path: "/recovery/reset-password",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", Schema_3)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { email, password } = req.validatedBody;
    const user = await user_repository_1.userRepository.findOne({ email }, { select: ["password", "passwordHistory"] });
    if (!user) {
        throw http_1.HttpException.notFound("Account not found.");
    }
    let history = user.passwordHistory || [];
    if (history.length) {
        let reused = false;
        for (const { password: previousPassword } of history) {
            const match = await (0, bcrypt_1.compare)(password, previousPassword);
            if (match) {
                reused = true;
                break;
            }
        }
        if (reused) {
            throw http_1.HttpException.badRequest("You cannot use a password you have used before.");
        }
    }
    history.unshift({ password: user.password, lastUsed: new Date() });
    history = history.slice(0, 20);
    await user_repository_1.userRepository.updateOne(user._id, { password, passwordHistory: history });
    return {
        success: true,
        message: "Password reset successfully."
    };
}));
