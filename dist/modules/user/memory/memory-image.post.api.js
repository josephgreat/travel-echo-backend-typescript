"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const memory_repository_1 = require("#src/db/repositories/memory.repository");
const memory_image_repository_1 = require("#src/db/repositories/memory-image.repository");
const constants_1 = require("#src/utils/constants");
const helpers_1 = require("#src/utils/helpers");
const cloudinary_1 = __importDefault(require("cloudinary"));
const async_busboy_1 = require("#src/utils/async-busboy");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/memories/:memory_id/images",
    method: "post"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const memory_id = req.params.memory_id.toString();
    const memory = await memory_repository_1.memoryRepository.findOne({ _id: memory_id, user: id });
    if (!memory) {
        throw http_1.HttpException.notFound("Memory not found");
    }
    const uploader = new async_busboy_1.AsyncBusboy({
        headers: req.headers,
        limits: {
            files: constants_1.MAX_MEMORY_IMAGES_PER_UPLOAD,
            fileSize: constants_1.MAX_MEMORY_IMAGE_SIZE
        }
    });
    uploader.handler(async (name, file) => {
        const imagePublicId = `${constants_1.MEMORY_IMAGE_PUBLIC_ID_PREFIX}${memory_id.toString()}_${(0, helpers_1.randomString)(16, "numeric")}`;
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.v2.uploader.upload_stream({
                asset_folder: `${constants_1.CLOUDINARY_MEMORY_IMAGES_FOLDER}/${memory_id}`,
                public_id: imagePublicId,
                display_name: imagePublicId,
                unique_filename: true
            }, (error, result) => {
                if (error)
                    return reject(error);
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
                }
                else {
                    reject(new Error("No result from Cloudinary"));
                }
            });
            file.pipe(stream);
        });
    });
    const { error, data } = await uploader.upload(req);
    if (!data || error) {
        throw http_1.HttpException.badRequest(error?.message || "Upload failed");
    }
    const failedImages = [];
    const successfulImages = [];
    const memoryImageData = [];
    data.forEach((image) => {
        if (image.error || !image.data) {
            failedImages.push(image);
        }
        else {
            successfulImages.push(image);
            memoryImageData.push(image.data);
        }
    });
    await memory_image_repository_1.memoryImageRepository.insertMany(memoryImageData);
    const newImageCount = (memory.imageCount || 0) + data.length;
    await memory_repository_1.memoryRepository.updateOne(memory._id, { imageCount: newImageCount }, { returning: true });
    return {
        success: true,
        totalFilesReceived: data.length,
        filesUploaded: successfulImages.length,
        filesFailed: failedImages.length,
        images: memoryImageData
    };
}));
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
