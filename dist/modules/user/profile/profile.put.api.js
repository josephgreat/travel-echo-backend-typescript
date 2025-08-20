"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = void 0;
const profile_model_1 = require("#src/db/models/profile.model");
const profile_repository_1 = require("#src/db/repositories/profile.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const zod_1 = require("zod");
const capitalizeGender = (req, res, next) => {
    if (req.body.gender) {
        req.body.gender = req.body.gender.trim().toUpperCase();
    }
    next();
};
const Schema = zod_1.z.object({
    dateOfBirth: zod_1.z
        .string()
        .optional()
        .transform((dob) => (dob ? new Date(dob) : undefined)),
    gender: zod_1.z.enum([profile_model_1.Gender.Male, profile_model_1.Gender.Female, profile_model_1.Gender.Other]).optional(),
    location: zod_1.z.string().optional(),
    school: zod_1.z
        .object({
        name: zod_1.z.string({ message: "Name of school is required" }),
        country: zod_1.z.string({ message: "Country of School is required" })
    })
        .optional(),
    occupation: zod_1.z.string().optional(),
    interests: zod_1.z.array(zod_1.z.string()).optional(),
    languages: zod_1.z.array(zod_1.z.string()).optional()
});
/**
 * @api {put} /users/me/profile
 * @desc Update user profile. If the profile doesn't exist, it will be created with the provided data
 * @domain {User: Profile}
 * @use {ContentAuth}
 * @body {json} {
    "dateOfBirth": "2000-01-01",
    "gender": "MALE | FEMALE | OTHER",
    "location": "Abuja, Nigeria",
    "school": { "name": "FullBright Academy", "country": "Nigeria" },
    "occupation": "student",
    "interests": ["travelling", "sports"],
    "languages": ["English", "Yoruba"]
  }
 * @res {json} { "success": true, "profile": {...} }
 */
exports.updateProfile = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/profile",
    method: "put",
    middleware: [capitalizeGender, (0, handlers_1.defineValidator)("body", Schema)]
}, (0, handlers_1.defineHandler)(async (req) => {
    const id = req.user?.id;
    const profileId = req.user?.profile;
    const data = req.validatedBody;
    const profile = await profile_repository_1.profileRepository.updateOne({ _id: profileId, user: id }, data, {
        returning: true
    });
    return { profile };
}));
