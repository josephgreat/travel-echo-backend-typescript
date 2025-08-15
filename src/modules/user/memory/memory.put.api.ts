import { memoryRepository } from "#src/db/repositories/memory.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { z } from "zod";
import { MemoryZodSchema } from "#src/db/models/memory.model";

export default defineApi(
  {
    group: "/users/me",
    path: "/memories/:memory_id",
    method: "put",
    middleware: defineValidator("body", MemoryZodSchema)
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const memory_id = req.params.memory_id.toString();

    const data = req.validatedBody as z.infer<typeof MemoryZodSchema>;

    try {
      const memory = await memoryRepository.updateUnique(
        { _id: memory_id, user: id, title: { value: data.title, forceUnique: true } },
        { _id: memory_id, user: id },
        data,
        { returning: true }
      );

      if (!memory) {
        throw HttpException.notFound("Memory not found");
      }

      return {
        memory
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

    /* const memory = await memoryRepository.findOne({ _id: memory_id, user: id });

    if (!memory) {
      throw HttpException.notFound("Memory not found");
    }

    const memoryWithConflictingTitle = await memoryRepository.findOne(
      { user: id, title: data.title },
      { filters: { isNot: { _id: memory_id } } }
    );

    if (memoryWithConflictingTitle) {
      throw HttpException.badRequest("A memory with this title already exists");
    }

    const updatedMemory = await memoryRepository.updateOne(memory._id, data, { returning: true });

    return { memory: updatedMemory }; */
  })
);

/**
 * @api {put} /users/me/memories/:memory_id
 * @par {memory_id} @path The memory id
 * @desc Updates a memory
 * @domain {User: Memories}
 * @use {ContentAuth}
 * @body {json}
 * {
 *  "title": "string | optional",
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
