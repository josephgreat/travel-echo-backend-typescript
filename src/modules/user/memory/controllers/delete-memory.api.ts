import { memoryRepository } from "#src/db/repositories/memory.repository";
import { api } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import deleteMemoryImages from "../services/delete-memory-images";

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
export default api(
  { group: "/users/me", path: "/memories/:memory_id", method: "delete" },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const memory_id = req.params.memory_id.toString();

    const memory = await memoryRepository.findOne({ _id: memory_id, user: id });

    if (!memory) {
      throw HttpException.notFound("Memory not found");
    }

    const { count } = await deleteMemoryImages(id, memory, "all");
    await memoryRepository.deleteOne(memory._id);

    return {
      success: true,
      message: "Memory and associated images deleted successfully",
      imagesDeleted: count
    };
  })
);
