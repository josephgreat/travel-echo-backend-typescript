import { api } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { memoryRepository } from "#src/db/repositories/memory.repository";
import { memoryImageRepository } from "#src/db/repositories/memory-image.repository";
import { MAX_MEMORY_IMAGE_SIZE, MAX_MEMORY_IMAGES_PER_UPLOAD } from "#src/utils/constants";
import { randomString } from "#src/utils/helpers";
import { MemoryImage } from "#src/db/models/memory-image.model";
import cloudinary from "cloudinary";
import { AsyncBusboy, FileUploadResult } from "#src/utils/async-busboy";

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

export default api(
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
      const imagePublicId = `IMG_MEM_${memory_id.toString()}_${randomString(16, "numeric")}`;

      return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            asset_folder: `MEMORY_IMAGES/${memory_id}`,
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

    /* return new Promise((resolve, reject) => {
      const images: ImageInfo[] = [];

      const uploadPromises: Promise<MemoryImage>[] = [];

      const bb = busboy({
        headers: req.headers,
        limits: {
          files: MAX_MEMORY_IMAGES_PER_UPLOAD,
          fileSize: MAX_MEMORY_IMAGE_SIZE
        }
      });

      bb.on("file", (fileName, file) => {
        const imagePublicId = `IMG_MEM_${memory_id.toString()}_${randomString(16, "numeric")}`;

        const uploadPromise = new Promise<MemoryImage>((uploadResolve, uploadReject) => {
          const stream = cloudinary.v2.uploader.upload_stream(
            {
              asset_folder: `MEMORY_IMAGES/${memory_id}`,
              public_id: imagePublicId,
              display_name: imagePublicId,
              unique_filename: true
            },
            (error, result) => {
              if (error) {
                images.push({ name: imagePublicId, success: false, error: error.message });
                return uploadReject(error);
              }

              if (result) {
                const image: MemoryImage = {
                  url: result.secure_url,
                  name: result.display_name,
                  publicId: result.public_id,
                  assetId: result.asset_id,
                  format: result.format,
                  bytes: result.bytes,
                  user: id,
                  memory: memory._id
                };
                images.push({ name: imagePublicId, success: true });
                uploadResolve(image);
              } else {
                images.push({
                  name: imagePublicId,
                  success: false,
                  error: "No result from Cloudinary"
                });
                uploadReject(new Error("No result from Cloudinary"));
              }
            }
          );

          file.pipe(stream);

          file.on("error", (err) => {
            images.push({ name: imagePublicId, success: false, error: err.message });
            uploadReject(err);
          });
        });

        uploadPromises.push(uploadPromise);
      });

      bb.on("error", (err) => {
        reject(HttpException.badRequest("Failed to upload file: " + (err as Error).message));
      });

      bb.on("finish", async () => {
        if (uploadPromises.length === 0) {
          reject(HttpException.badRequest("No files uploaded"));
          return;
        }

        try {
          const uploadedImages = await Promise.all(uploadPromises);

          const failedImages: ImageInfo[] = [];
          const successfulImages: ImageInfo[] = [];

          images.forEach((image) => {
            if (image.success) {
              successfulImages.push(image);
            } else {
              failedImages.push(image);
            }
          });

          await memoryImageRepository.insertMany(uploadedImages);

          const newImageCount = (memory.imageCount || 0) + uploadedImages.length;

          await memoryRepository.updateOne(
            memory._id,
            { imageCount: newImageCount },
            { returning: true }
          );

          resolve({
            success: true,
            totalFilesReceived: images.length,
            filesUploaded: successfulImages.length,
            filesFailed: failedImages.length,
            images: uploadedImages
          });
        } catch (err) {
          reject(HttpException.badRequest("Upload failed: " + (err as Error).message));
        }
      });

      req.pipe(bb);
    }); */
  })
);
