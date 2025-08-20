"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const zod_1 = require("zod");
const constants_1 = require("#src/utils/constants");
const user_repository_1 = require("#src/db/repositories/user.repository");
const helpers_1 = require("#src/utils/helpers");
const user_model_1 = require("#src/db/models/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
const profile_model_1 = require("#src/db/models/profile.model");
const milestone_model_1 = require("#src/db/models/milestone.model");
const Schema = zod_1.z
    .object({
    name: zod_1.z.string({ message: "Name is required" }),
    email: zod_1.z
        .string({ message: "Email is required" })
        .email({ message: "Invalid email" }),
    password: zod_1.z
        .string({ message: "Password is required" })
        .min(constants_1.MIN_PASSWORD_LENGTH, {
        message: `Password must be at least ${constants_1.MIN_PASSWORD_LENGTH} characters long`
    })
        .max(constants_1.MAX_PASSWORD_LENGTH, {
        message: `Password must be at most ${constants_1.MAX_PASSWORD_LENGTH} characters long`
    })
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
 * @api {post} /auth/register
 * @domain Authentication
 * @desc Register
 * @header {Content-Type} application/json
 * @body {json} { "name": "string", "email": "string", "password": "string", "confirmPassword": "string" }
 * @res {json}  { "success": true, "message": "string", "user": {...} }
 */
exports.default = (0, api_1.defineApi)({
    group: "/auth",
    path: "/register",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { name, email, password } = req.validatedBody;
    const existingUser = await user_repository_1.userRepository.findOne({ email });
    if (existingUser) {
        throw http_1.HttpException.badRequest("Email already in use. Try logging in instead.");
    }
    const userId = new mongoose_1.default.Types.ObjectId();
    const profileId = new mongoose_1.default.Types.ObjectId();
    const [user, profile] = await Promise.all([
        user_model_1.UserModel.create({
            _id: userId,
            profile: profileId,
            name,
            email,
            password,
            role: user_model_1.UserRole.User
        }),
        profile_model_1.ProfileModel.create({ _id: profileId, user: userId }),
        milestone_model_1.MilestoneModel.create({ user: userId })
    ]);
    return {
        success: true,
        message: "User registered successfully.",
        user: {
            ...(0, helpers_1.omit)(user, ["password", "passwordHistory"]),
            profile: {
                _id: profile._id,
                user: profile.user._id
            }
        }
    };
}));
