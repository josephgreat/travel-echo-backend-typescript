import { MemoryZodSchema } from "#src/db/models/memory.model";
import { memoryRepository } from "#src/db/repositories/memory.repository";
import { milestoneRepository } from "#src/db/repositories/milestone.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { z } from "zod";
import { awardBadgeIfEligible } from "../badges/services/award-badge-if-eligible";
import { BadgeCategory } from "#src/db/models/badge.model";

export default defineApi(
  {
    group: "/users/me",
    path: "/memories",
    method: "post",
    middleware: defineValidator("body", MemoryZodSchema)
  },
  defineHandler(async (req) => {
    const { id } = req.user!;

    const data = req.validatedBody as z.infer<typeof MemoryZodSchema>;

    try {
      const milestone = await milestoneRepository.findOrCreate({ user: id }, { user: id });

      const [memory] = await Promise.all([
        memoryRepository.createUnique(
          { user: id, title: { value: data.title, forceUnique: true } },
          { user: id, ...data }
        ),

        milestoneRepository.updateOne(milestone._id, { totalMemories: milestone.totalMemories + 1 })
      ]);

      const { hasEarnedNewBadge, badge } = await awardBadgeIfEligible(id, BadgeCategory.Memory);

      return {
        memory,
        hasEarnedNewBadge,
        badge
      };
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "DUPLICATE_FIELD_ERROR" ||
          error.name === "MAX_UNIQUE_VALUE_GENERATION_ERROR"
        ) {
          throw HttpException.badRequest("A memory with this title already exists.");
        }
      }
      throw error;
    }
  })
);

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
 *  "hasEarnedNewBadge": "boolean",
 *  "badge": "badge info | null",
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
