import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { memoryRepository } from "#src/db/repositories/memory.repository";
import { memoryImageRepository } from "#src/db/repositories/memory-image.repository";
import { GET_REQUEST_DATA_LIMIT } from "#src/utils/constants";

export default defineApi(
  {
    group: "/users/me",
    path: "/memories/:memory_id/images",
    method: "get"
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const memory_id = req.params.memory_id.toString();

    const memory = await memoryRepository.findOne({ _id: memory_id, user: id });

    if (!memory) {
      throw HttpException.notFound("Memory not found");
    }

    const { skip, limit, sort } = req.parsedQuery || {};

    const cappedLimit = Math.min(limit || GET_REQUEST_DATA_LIMIT, GET_REQUEST_DATA_LIMIT);

    const images = await memoryImageRepository.findMany(
      { memory: memory._id },
      { skip, limit: cappedLimit, sort: { createdAt: -1, ...(sort ? sort : {}) } }
    );

    return {
      success: true,
      images
    };
  })
);

/**
 * @api {get} /users/me/memories/:memory_id/images
 * @desc Gets all images for a memory
 * @domain {User: Memories}
 * @header {Authorization} Bearer <token>
 * @par {memory_id} @path The memory ID
 * @par {skip?} @query The number of images to skip e.g. skip=0
 * @par {limit?} @query The number of images to return (max: 10 at a time) e.g. limit=10
 * @par {sort?} @query The sort order e.g. sort=createdAt,desc
 * @res {json}
 * {
 *  "success": true,
 *  "images": [
 *    {
 *      "_id": "65defc452caed3211ad24de4e",
 *      "publicId": "public_id",
 *      "url": "https://res.cloudinary.com/your-cloud-name/image/upload/v1672500000/your-image.jpg",
 *      "user": "65defc452caed3211ad24de4e",
 *      "memory": "62dae0d52caed6001ad24da0",
 *      "name": "IMG-MEM-34442323N324N57585744",
 *      "format": "jpg",
 *      "bytes": 123456,
 *      "createdAt": "2023-01-01T00:00:00.000Z",
 *      "updatedAt": "2023-01-01T00:00:00.000Z"
 *    }
 *  ]
 * }
 */
