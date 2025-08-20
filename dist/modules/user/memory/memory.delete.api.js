"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const memory_repository_1 = require("#src/db/repositories/memory.repository");
// import { milestoneRepository } from "#src/db/repositories/milestone.repository";
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const delete_memory_images_1 = __importDefault(require("./services/delete-memory-images"));
const cloudinary_1 = __importDefault(require("cloudinary"));
/**
 * @api {delete} /users/me/memories/:memory_id
 * @desc Deletes a memory and all associated images
 * @domain {User: Memories}
 * @header {Authorization} Bearer <token>
 * @par {memory_id} @path The memory ID
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Memory and associated images deleted successfully",
 *  "imagesDeleted": 20
 * }
 */
exports.default = (0, api_1.defineApi)({ group: "/users/me", path: "/memories/:memory_id", method: "delete" }, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const memory_id = req.params.memory_id.toString();
    const memory = await memory_repository_1.memoryRepository.findOne({ _id: memory_id, user: id });
    if (!memory) {
        throw http_1.HttpException.notFound("Memory not found");
    }
    /*  const milestone = await milestoneRepository.findOrCreate(
      { user: id },
      { user: id, totalMemories: 0, totalTrips: 0 }
    ); */
    const { count } = await (0, delete_memory_images_1.default)(id, memory, "all");
    await Promise.all([
        memory_repository_1.memoryRepository.deleteOne(memory._id),
        cloudinary_1.default.v2.api.delete_folder(`MEMORY_IMAGES/${memory_id}`)
        /* milestoneRepository.updateOne(milestone._id, {
          totalMemories: Math.min(milestone.totalMemories - 1, 0)
        }) */
    ]);
    return {
        success: true,
        message: "Memory and associated images deleted successfully",
        imagesDeleted: count
    };
}));
