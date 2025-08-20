"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const memory_repository_1 = require("#src/db/repositories/memory.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const mongoose_1 = __importStar(require("mongoose"));
const zod_1 = require("zod");
const delete_memory_images_1 = __importDefault(require("./services/delete-memory-images"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const memory_image_repository_1 = require("#src/db/repositories/memory-image.repository");
const Schema = zod_1.z
    .array(zod_1.z.object({
    _id: zod_1.z
        .string({ message: "Image ID is required" })
        .refine((id) => (0, mongoose_1.isValidObjectId)(id), { message: "Invalid image ID" })
        .transform((id) => new mongoose_1.default.Types.ObjectId(id)),
    publicId: zod_1.z.string({ message: "Invalid public ID" }).optional()
}), { message: "Data must be an array of images" })
    .max(constants_1.MAX_MEMORY_IMAGES_PER_DELETE, `A maximum of ${constants_1.MAX_MEMORY_IMAGES_PER_DELETE} images can be deleted at a time`);
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/memories/:memory_id/images/delete",
    method: "patch",
    middleware: (0, handlers_1.defineValidator)("body", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const memory_id = req.params.memory_id.toString();
    const images = req.validatedBody;
    const memory = await memory_repository_1.memoryRepository.findOne({ _id: memory_id, user: id });
    if (!memory) {
        throw http_1.HttpException.notFound("Memory not found");
    }
    const imageIds = images.map((image) => image._id);
    const publicIds = images
        .map((image) => image.publicId)
        .filter((publicId) => publicId !== undefined);
    if (images.length === 0) {
        //Delete all images
        const { count } = await (0, delete_memory_images_1.default)(id, memory, "all");
        const newImageCount = Math.max((memory.imageCount || 0) - count, 0);
        await memory_repository_1.memoryRepository.updateOne(memory._id, { imageCount: newImageCount });
        await cloudinary_1.default.v2.api.delete_folder(`${constants_1.CLOUDINARY_MEMORY_IMAGES_FOLDER}/${memory_id}`);
        return {
            success: true,
            message: "All images deleted successfully",
            imagesDeleted: count
        };
    }
    let definedPublicIds = publicIds;
    if (publicIds.length !== images.length) {
        //all public Id's are not present
        const imagesToDelete = await memory_image_repository_1.memoryImageRepository.findMany({ user: id, memory: memory._id }, { filters: { in: { _id: imageIds } } });
        definedPublicIds = imagesToDelete.map((img) => img.publicId);
    }
    await cloudinary_1.default.v2.api.delete_resources(definedPublicIds, { invalidate: true });
    const result = await memory_image_repository_1.memoryImageRepository.deleteMany({ user: id, memory: memory._id }, { in: { _id: imageIds } });
    const newImageCount = Math.max((memory.imageCount || 0) - result.deletedCount, 0);
    await memory_repository_1.memoryRepository.updateOne(memory._id, { imageCount: newImageCount });
    return {
        success: true,
        message: "Images deleted successfully",
        imagesDeleted: result.deletedCount
    };
}));
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
