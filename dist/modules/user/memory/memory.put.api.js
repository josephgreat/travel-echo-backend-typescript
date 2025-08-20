"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memory_repository_1 = require("#src/db/repositories/memory.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const memory_model_1 = require("#src/db/models/memory.model");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/memories/:memory_id",
    method: "put",
    middleware: (0, handlers_1.defineValidator)("body", memory_model_1.MemoryZodSchema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const memory_id = req.params.memory_id.toString();
    const data = req.validatedBody;
    try {
        const memory = await memory_repository_1.memoryRepository.updateUnique({ _id: memory_id, user: id, title: { value: data.title, forceUnique: true } }, { _id: memory_id, user: id }, data, { returning: true });
        if (!memory) {
            throw http_1.HttpException.notFound("Memory not found");
        }
        return {
            memory
        };
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.name === "DUPLICATE_FIELD_ERROR" ||
                error.name === "MAX_UNIQUE_VALUE_GENERATION_ERROR") {
                throw http_1.HttpException.badRequest("A memory with this title already exists.");
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
}));
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
