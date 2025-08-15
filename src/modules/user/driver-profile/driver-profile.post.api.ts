import { driverProfileRepository } from "#src/db/repositories/driver-profile.repository";
import { userRepository } from "#src/db/repositories/user.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { MIN_LICENSE_PLATE_LENGTH } from "#src/utils/constants";
import { castToObjectId } from "#src/utils/helpers";
import { z } from "zod";

export const Schema = z.object({
  car: z
    .object({
      make: z.string({ message: "Car make is required" }).trim(),
      model: z.string({ message: "Car model is required" }).trim(),
      year: z.number({ message: "Car year is required" }),
      color: z.string({ message: "Car color is required" }).trim(),
      licensePlate: z
        .string({ message: "Car license plate is required" })
        .min(MIN_LICENSE_PLATE_LENGTH, {
          message: `Car license plate must be at least ${MIN_LICENSE_PLATE_LENGTH} characters long`
        })
    })
    .optional(),
  phoneNumber: z.string({ message: "Invalid phone number provided" }).optional(),
  serviceDescription: z.string({ message: "Invalid service description provided" }).optional()
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

export default defineApi(
  {
    group: "/users/me",
    path: "driver-profile/{:user_id}",
    method: "post",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const id = req.params.user_id || req.user?.id;
    if (!id) {
      throw HttpException.badRequest("No user ID provided");
    }
    const userId = id.toString();

    const data = req.validatedBody as z.infer<typeof Schema>;

    const user = await userRepository.findById(userId);
    if (!user) {
      throw HttpException.notFound("User not found");
    }

    await Promise.all([
      userRepository.updateOne({ _id: userId }, { isDriver: true }),
      driverProfileRepository.create({ user: castToObjectId(userId), ...data })
    ]);

    return {
      message: "Driver profile created successfully"
    };
  })
);
