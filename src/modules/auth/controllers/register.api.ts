import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { z } from "zod";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "#src/utils/constants";
import { userRepository } from "#src/db/repositories/user.repository";
import { omit } from "#src/utils/helpers";
import { UserModel, UserRole } from "#src/db/models/user.model";
import mongoose from "mongoose";
import { ProfileModel } from "#src/db/models/profile.model";
import { MilestoneModel } from "#src/db/models/milestone.model";

const Schema = z
  .object({
    name: z.string({ message: "Name is required" }),
    email: z
      .string({ message: "Email is required" })
      .email({ message: "Invalid email" }),
    password: z
      .string({ message: "Password is required" })
      .min(MIN_PASSWORD_LENGTH, {
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
      })
      .max(MAX_PASSWORD_LENGTH, {
        message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters long`
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
    confirmPassword: z.string({ message: "Confirm Password is required" })
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
export default defineApi(
  {
    group: "/auth",
    path: "/register",
    method: "post",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const { name, email, password } = req.validatedBody as z.infer<
      typeof Schema
    >;
    const existingUser = await userRepository.findOne({ email });
    if (existingUser) {
      throw HttpException.badRequest(
        "Email already in use. Try logging in instead."
      );
    }
    const userId = new mongoose.Types.ObjectId();
    const profileId = new mongoose.Types.ObjectId();

    const [user, profile] = await Promise.all([
      UserModel.create({
        _id: userId,
        profile: profileId,
        name,
        email,
        password,
        role: UserRole.User
      }),
      ProfileModel.create({ _id: profileId, user: userId }),
      MilestoneModel.create({ user: userId })
    ]);

    return {
      success: true,
      message: "User registered successfully.",
      user: {
        ...omit(user, ["password", "passwordHistory"]),
        profile: {
          _id: profile._id,
          user: profile.user._id
        }
      }
    };
  })
);
