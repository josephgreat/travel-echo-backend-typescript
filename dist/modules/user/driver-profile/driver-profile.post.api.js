"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = void 0;
const driver_profile_repository_1 = require("#src/db/repositories/driver-profile.repository");
const user_repository_1 = require("#src/db/repositories/user.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const helpers_1 = require("#src/utils/helpers");
const zod_1 = require("zod");
exports.Schema = zod_1.z.object({
    car: zod_1.z
        .object({
        make: zod_1.z.string({ message: "Car make is required" }).trim(),
        model: zod_1.z.string({ message: "Car model is required" }).trim(),
        year: zod_1.z.number({ message: "Car year is required" }),
        color: zod_1.z.string({ message: "Car color is required" }).trim(),
        licensePlate: zod_1.z
            .string({ message: "Car license plate is required" })
            .min(constants_1.MIN_LICENSE_PLATE_LENGTH, {
            message: `Car license plate must be at least ${constants_1.MIN_LICENSE_PLATE_LENGTH} characters long`
        })
    })
        .optional(),
    phoneNumber: zod_1.z.string({ message: "Invalid phone number provided" }).optional(),
    serviceDescription: zod_1.z.string({ message: "Invalid service description provided" }).optional()
});
/**
 * @api {post} /users/me/driver-profile/:user_id?
 * @desc Creates a driver profile
 * @domain {User: Driver Profile}
 * @use {Auth}
 * @body {json}
 * {
 *  "car": {
 *    "make": "string | required",
 *    "model": "string | required",
 *    "year": "number | required",
 *    "color": "string | required",
 *    "licensePlate": "string | required"
 *  },
 *  "phoneNumber": "string | optional",
 *  "serviceDescription": "string | optional"
 * }
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Driver profile created successfully"
 * }
 */
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "driver-profile/{:user_id}",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", exports.Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const id = req.params.user_id || req.user?.id;
    if (!id) {
        throw http_1.HttpException.badRequest("No user ID provided");
    }
    const userId = id.toString();
    const data = req.validatedBody;
    const user = await user_repository_1.userRepository.findById(userId);
    if (!user) {
        throw http_1.HttpException.notFound("User not found");
    }
    await Promise.all([
        user_repository_1.userRepository.updateOne({ _id: userId }, { isDriver: true }),
        driver_profile_repository_1.driverProfileRepository.create({ user: (0, helpers_1.castToObjectId)(userId), ...data })
    ]);
    return {
        message: "Driver profile created successfully"
    };
}));
