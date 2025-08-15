import { Gender } from "#src/db/models/profile.model";
import { profileRepository } from "#src/db/repositories/profile.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";

const capitalizeGender = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.gender) {
    req.body.gender = req.body.gender.trim().toUpperCase();
  }
  next();
};

const Schema = z.object({
  dateOfBirth: z
    .string()
    .optional()
    .transform((dob) => (dob ? new Date(dob) : undefined)),
  gender: z.enum([Gender.Male, Gender.Female, Gender.Other]).optional(),
  location: z.string().optional(),
  school: z
    .object({
      name: z.string({ message: "Name of school is required" }),
      country: z.string({ message: "Country of School is required" })
    })
    .optional(),
  occupation: z.string().optional(),
  interests: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional()
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
export const updateProfile = defineApi(
  {
    group: "/users/me",
    path: "/profile",
    method: "put",
    middleware: [capitalizeGender, defineValidator("body", Schema)]
  },
  defineHandler(async (req) => {
    const id = req.user?.id;
    const profileId = req.user?.profile;

    const data = req.validatedBody as z.infer<typeof Schema>;

    const profile = await profileRepository.updateOne({ _id: profileId, user: id }, data, {
      returning: true
    });

    return { profile };
  })
);
