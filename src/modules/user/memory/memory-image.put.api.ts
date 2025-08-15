import { memoryImageRepository } from "#src/db/repositories/memory-image.repository";
import { memoryRepository } from "#src/db/repositories/memory.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { MAX_UNIQUE_IMAGE_NAME_GENERATION_ATTEMPTS } from "#src/utils/constants";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(1).max(255).trim()
});

/**
 * @api {put} /users/me/memories/:memory_id/images/:image_id
 * @par {memory_id} @path The memory id
 * @par {image_id} @path The image id
 * @desc Updates a memory image. Only the name can be updated.
 * @domain {User: Memories}
 * @header {Authorization} Bearer <token>
 * @body {json} { "name": "string | required" }
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Image name updated successfully",
 *  "image": {
 *    "_id": "65defc452caed3211ad24de4e",
 *    "publicId": "public_id",
 *    "url": "https://res.cloudinary.com/your-cloud-name/image/upload/v1672500000/your-image.jpg",
 *    "user": "65defc452caed3211ad24de4e",
 *    "memory": "62dae0d52caed6001ad24da0",
 *    "name": "IMG-MEM-34442323N324N57585744",
 *    "format": "jpg",
 *    "bytes": 123456,
 *    "createdAt": "2023-01-01T00:00:00.000Z",
 *    "updatedAt": "2023-01-01T00:00:00.000Z"
 *  }
 * }
 */
export default defineApi(
  {
    group: "/users/me",
    path: "/memories/:memory_id/images/:image_id",
    method: "put",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const memory_id = req.params.memory_id.toString();
    const image_id = req.params.image_id.toString();
    const { name } = req.validatedBody as z.infer<typeof Schema>;

    const memory = await memoryRepository.findOne({ _id: memory_id, user: id });
    if (!memory) {
      throw HttpException.notFound("Memory not found");
    }

    const image = await memoryImageRepository.findById(image_id);

    if (!image) {
      throw HttpException.notFound("Image not found");
    }

    if (image.name === name) {
      return {
        success: true,
        message: "Image name unchanged",
        image
      };
    }

    // Generate unique name if needed
    let newName = name;
    let counter = 0;
    const MAX_ATTEMPTS = MAX_UNIQUE_IMAGE_NAME_GENERATION_ATTEMPTS;

    while (counter < MAX_ATTEMPTS) {
      const exists = await memoryImageRepository.findOne(
        { name: newName, memory: image.memory },
        { filters: { isNot: { _id: image._id } } }
      );

      if (!exists) break;

      counter++;
      newName = `${name}(${counter})`;
    }

    if (counter > MAX_ATTEMPTS) {
      throw HttpException.badRequest(
        "Could not find a unique name variant after multiple attempts"
      );
    }

    const updatedImage = await memoryImageRepository.updateOne(
      { _id: image_id },
      { name: newName },
      { returning: true }
    );

    /* const updatedImage = await memoryImageRepository.updateUnique(
      { _id: image_id, memory: image.memory, name: { value: name, forceUnique: true } },
      { _id: image_id, memory: memory._id },
      { name }
    ) */

    return {
      success: true,
      message: "Image name updated successfully",
      image: updatedImage
    };
  })
);
