"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = require("#src/db/repositories/user.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const helpers_1 = require("#src/utils/helpers");
const bcrypt_1 = require("bcrypt");
const zod_1 = require("zod");
const Schema = zod_1.z.object({
    email: zod_1.z.string({ message: "Email is required" }).email({ message: "Invalid email" }),
    password: zod_1.z
        .string({ message: "Password is required" })
        .min(constants_1.MIN_PASSWORD_LENGTH, {
        message: `Password must be at least ${constants_1.MIN_PASSWORD_LENGTH} characters long`
    })
        .max(constants_1.MAX_PASSWORD_LENGTH, {
        message: `Password must be at most ${constants_1.MAX_PASSWORD_LENGTH} characters long`
    })
}, { message: "Request body is invalid" });
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
exports.default = (0, api_1.defineApi)({
    group: "/auth",
    path: "/login",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { email, password } = req.validatedBody;
    const user = await user_repository_1.userRepository.findOne({ email }, {
        include: ["password", "passwordHistory"],
        populate: ["profile", "subscription"]
    });
    if (!user) {
        throw new http_1.HttpException(401, "Invalid email or password.");
    }
    if (!user.verified) {
        throw new http_1.HttpException(402, "Email is not verified.", {
            errorCode: constants_1.errorCodes.EMAIL_NOT_VERIFIED
        });
    }
    const isMatch = await (0, bcrypt_1.compare)(password, user.password);
    if (!isMatch) {
        throw new http_1.HttpException(401, "Invalid email or password.");
    }
    const token = (0, helpers_1.signJWT)({ userId: user._id.toString(), email: user.email }, { expiresIn: constants_1.JWT_LOGIN_SESSION_DURATION });
    return {
        message: "Login successful",
        user: {
            ...(0, helpers_1.omit)(user, ["password", "passwordHistory"]),
            subscription: user.subscription || null,
            token
        }
    };
}));
