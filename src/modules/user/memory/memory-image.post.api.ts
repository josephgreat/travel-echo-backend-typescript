import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { memoryRepository } from "#src/db/repositories/memory.repository";
import { memoryImageRepository } from "#src/db/repositories/memory-image.repository";
import {
  CLOUDINARY_MEMORY_IMAGES_FOLDER,
  MAX_MEMORY_IMAGE_SIZE,
  MAX_MEMORY_IMAGES_PER_UPLOAD,
  MEMORY_IMAGE_PUBLIC_ID_PREFIX
} from "#src/utils/constants";
import { randomString } from "#src/utils/helpers";
import { MemoryImage } from "#src/db/models/memory-image.model";
import cloudinary from "cloudinary";
import { AsyncBusboy, FileUploadResult } from "#src/utils/async-busboy";

export default defineApi(
  {
    group: "/users/me",
    path: "/memories/:memory_id/images",
    method: "post"
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const memory_id = req.params.memory_id.toString();

    const memory = await memoryRepository.findOne({ _id: memory_id, user: id });
    if (!memory) {
      throw HttpException.notFound("Memory not found");
    }

    const uploader = new AsyncBusboy({
      headers: req.headers,
      limits: {
        files: MAX_MEMORY_IMAGES_PER_UPLOAD,
        fileSize: MAX_MEMORY_IMAGE_SIZE
      }
    });

    uploader.handler(async (name, file) => {
      const imagePublicId = `${MEMORY_IMAGE_PUBLIC_ID_PREFIX}${memory_id.toString()}_${randomString(16, "numeric")}`;

      return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            asset_folder: `${CLOUDINARY_MEMORY_IMAGES_FOLDER}/${memory_id}`,
            public_id: imagePublicId,
            display_name: imagePublicId,
            unique_filename: true
          },
          (error, result) => {
            if (error) return reject(error);

            if (result) {
              resolve({
                url: result.secure_url,
                name: result.display_name,
                publicId: result.public_id,
                assetId: result.asset_id,
                format: result.format,
                bytes: result.bytes,
                user: id,
                memory: memory._id
              });
            } else {
              reject(new Error("No result from Cloudinary"));
            }
          }
        );
        file.pipe(stream);
      });
    });

    const { error, data } = await uploader.upload<Partial<MemoryImage>>(req);

    if (!data || error) {
      throw HttpException.badRequest(error?.message || "Upload failed");
    }

    const failedImages: FileUploadResult[] = [];
    const successfulImages: FileUploadResult[] = [];
    const memoryImageData: Partial<MemoryImage>[] = [];

    data.forEach((image) => {
      if (image.error || !image.data) {
        failedImages.push(image);
      } else {
        successfulImages.push(image);
        memoryImageData.push(image.data);
      }
    });

    await memoryImageRepository.insertMany(memoryImageData);

    const newImageCount = (memory.imageCount || 0) + data.length;

    await memoryRepository.updateOne(
      memory._id,
      { imageCount: newImageCount },
      { returning: true }
    );

    return {
      success: true,
      totalFilesReceived: data.length,
      filesUploaded: successfulImages.length,
      filesFailed: failedImages.length,
      images: memoryImageData
    };
  })
);

/**
 * @api {post} /users/me/memories/:memory_id/images
 * @desc Adds a maximum of 20 images at a time to a memory
 * @domain {User: Memories}
 * @use {Auth}
 * @par {memory_id} @path The memory ID
 * @body {FormData} Form Data
 * @res {json}
 * {
 *  "success": true,
 *  "totalFilesReceived": 50,
 *  "filesUploaded": 50,
 *  "filesFailed": 0,
 *  "images": [
 *    {
 *    "url": "https://res.cloudinary.com/...IMG_MEM_68122116ecccbf17300a8829.png",
 *    "name": "IMG_MEM_IMG_MEM_68122116ecccbf17300a8829",
 *    "publicId": "IMG_MEM_IMG_MEM_68122116ecccbf17300a8829",
 *    "assetId": "63545234234344",
 *    "format": "jpg",
 *    "bytes": 67541
 *   }
 *  ]
 * }
 */
