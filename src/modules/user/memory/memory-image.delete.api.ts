import { memoryRepository } from "#src/db/repositories/memory.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import {
  CLOUDINARY_MEMORY_IMAGES_FOLDER,
  MAX_MEMORY_IMAGES_PER_DELETE
} from "#src/utils/constants";
import mongoose, { isValidObjectId } from "mongoose";
import { z } from "zod";
import deleteMemoryImages from "./services/delete-memory-images";
import cloudinary from "cloudinary";
import { memoryImageRepository } from "#src/db/repositories/memory-image.repository";

const Schema = z
  .array(
    z.object({
      _id: z
        .string({ message: "Image ID is required" })
        .refine((id) => isValidObjectId(id), { message: "Invalid image ID" })
        .transform((id) => new mongoose.Types.ObjectId(id)),
      publicId: z.string({ message: "Invalid public ID" }).optional()
    }),
    { message: "Data must be an array of images" }
  )
  .max(
    MAX_MEMORY_IMAGES_PER_DELETE,
    `A maximum of ${MAX_MEMORY_IMAGES_PER_DELETE} images can be deleted at a time`
  );

export default defineApi(
  {
    group: "/users/me",
    path: "/memories/:memory_id/images/delete",
    method: "patch",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const memory_id = req.params.memory_id.toString();
    const images = req.validatedBody as z.infer<typeof Schema>;

    const memory = await memoryRepository.findOne({ _id: memory_id, user: id });
    if (!memory) {
      throw HttpException.notFound("Memory not found");
    }

    const imageIds = images.map((image) => image._id);
    const publicIds = images
      .map((image) => image.publicId)
      .filter((publicId) => publicId !== undefined);

    if (images.length === 0) {
      //Delete all images
      const { count } = await deleteMemoryImages(id, memory, "all");
      const newImageCount = Math.max((memory.imageCount || 0) - count, 0);
      await memoryRepository.updateOne(memory._id, { imageCount: newImageCount });
      await cloudinary.v2.api.delete_folder(`${CLOUDINARY_MEMORY_IMAGES_FOLDER}/${memory_id}`);
      return {
        success: true,
        message: "All images deleted successfully",
        imagesDeleted: count
      };
    }

    let definedPublicIds: Array<string> = publicIds;

    if (publicIds.length !== images.length) {
      //all public Id's are not present
      const imagesToDelete = await memoryImageRepository.findMany(
        { user: id, memory: memory._id },
        { filters: { in: { _id: imageIds } } }
      );
      definedPublicIds = imagesToDelete.map((img) => img.publicId);
    }

    await cloudinary.v2.api.delete_resources(definedPublicIds, { invalidate: true });
    const result = await memoryImageRepository.deleteMany(
      { user: id, memory: memory._id },
      { in: { _id: imageIds } }
    );

    const newImageCount = Math.max((memory.imageCount || 0) - result.deletedCount, 0);
    await memoryRepository.updateOne(memory._id, { imageCount: newImageCount });

    return {
      success: true,
      message: "Images deleted successfully",
      imagesDeleted: result.deletedCount
    };
  })
);

/**
 * @api {patch} /users/me/memories/:memory_id/images/delete
 * @desc Deletes images from the memory
 * @domain {User: Memories}
 * @use {Auth}
 * @body {json} [{ "_id": "6815944cceb9b484e6264d44", "publicId": "optional | IMG_MEM_6815944cceb9b484e6264d44"} ]
 * @bodyDesc Image array must contain a maximum of 50 images.
 * If an empty array is provided, **all** the images are deleted.
 * The process is faster if public IDs for each image are also provided.
 * @res {json} { "success": true, "message": "Images deleted successfully", "imagesDeleted": 20 }
 */
