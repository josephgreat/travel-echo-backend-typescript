"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memory_image_repository_1 = require("#src/db/repositories/memory-image.repository");
const memory_repository_1 = require("#src/db/repositories/memory.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const zod_1 = require("zod");
const Schema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).trim()
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
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/memories/:memory_id/images/:image_id",
    method: "put",
    middleware: (0, handlers_1.defineValidator)("body", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const memory_id = req.params.memory_id.toString();
    const image_id = req.params.image_id.toString();
    const { name } = req.validatedBody;
    const memory = await memory_repository_1.memoryRepository.findOne({ _id: memory_id, user: id });
    if (!memory) {
        throw http_1.HttpException.notFound("Memory not found");
    }
    const image = await memory_image_repository_1.memoryImageRepository.findById(image_id);
    if (!image) {
        throw http_1.HttpException.notFound("Image not found");
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
    const MAX_ATTEMPTS = constants_1.MAX_UNIQUE_IMAGE_NAME_GENERATION_ATTEMPTS;
    while (counter < MAX_ATTEMPTS) {
        const exists = await memory_image_repository_1.memoryImageRepository.findOne({ name: newName, memory: image.memory }, { filters: { isNot: { _id: image._id } } });
        if (!exists)
            break;
        counter++;
        newName = `${name}(${counter})`;
    }
    if (counter > MAX_ATTEMPTS) {
        throw http_1.HttpException.badRequest("Could not find a unique name variant after multiple attempts");
    }
    const updatedImage = await memory_image_repository_1.memoryImageRepository.updateOne({ _id: image_id }, { name: newName }, { returning: true });
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
}));
