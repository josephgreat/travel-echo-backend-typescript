import { memoryRepository } from "#src/db/repositories/memory.repository";
import { api } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { z } from "zod";

export const ZodMemorySchema = z.object({
  title: z.string({ message: "Title is required" }).min(3, { message: "Title is too short" }),
  description: z.string({ message: "Invalid description provided" }).optional(),
  location: z.string({ message: "Invalid location provided" }).optional(),
  date: z
    .string({ message: "Invalid date provided" })
    .optional()
    .transform((dob) => (dob ? new Date(dob) : undefined)),
  tags: z.array(z.string({ message: "Invalid tag provided" })).optional(),
  isPublic: z.boolean({ message: "Public status should be true or false" }).optional()
}, { message: "No request body provided" });

/**
 * @api {post} /users/me/memories
 * @desc Creates a new memory
 * @domain {User: Memories}
 * @use {ContentAuth}
 * @body {json}
 * {
 *  "title": "string | required",
 *  "description": "string | optional",
 *  "location": "string | optional",
 *  "date": "date | optional",
 *  "tags": "array of strings | optional",
 *  "isPublic": "boolean | optional | default true"
 * }
 * @res {json}
 * {
 *  "success": true,
 *  "memory": {
 *    "_id": "65defc452caed3211ad24de4e",
 *    "title": "Hike to Mount Fuji",
 *    "description": "description of memory",
 *    "location": "Tokyo, Japan",
 *    "date": "2023-01-01",
 *    "tags": ["hiking", "nature"],
 *    "isPublic": true,
 *    "createdAt": "2023-01-01T00:00:00.000Z",
 *    "updatedAt": "2023-01-01T00:00:00.000Z"
 *  }
 * }
 */
export default api(
  {
    group: "/users/me",
    path: "/memories",
    method: "post",
    middleware: defineValidator("body", ZodMemorySchema)
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const data = req.validatedBody as z.infer<typeof ZodMemorySchema>;
    const memoryWithExistingTitle = await memoryRepository.findOne({ user: id, title: data.title });
    if (memoryWithExistingTitle) {
      throw HttpException.badRequest("A memory with this title already exists");
    }
    const memory = await memoryRepository.create({ user: id, ...data });
    return { memory };
  })
);
