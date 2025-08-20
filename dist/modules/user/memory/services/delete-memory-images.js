"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deleteMemoryImages;
const constants_1 = require("#src/utils/constants");
const memory_image_repository_1 = require("#src/db/repositories/memory-image.repository");
const helpers_1 = require("#src/utils/helpers");
const cloudinary_1 = __importDefault(require("cloudinary"));
async function deleteMemoryImages(userId, memory, count) {
    if (!memory) {
        throw new Error("No memory provided");
    }
    const imageCount = memory.imageCount ?? 0;
    const amountToDelete = count === "all" ? imageCount : count;
    if (amountToDelete < 1) {
        //throw new Error("No image deleted");
        return { count: 0 };
    }
    let processedCount = 0;
    while (processedCount < amountToDelete) {
        const remaining = amountToDelete - processedCount;
        const currentBatchSize = Math.min(constants_1.PROCESSING_BATCH_SIZE, remaining);
        const batch = await memory_image_repository_1.memoryImageRepository.findMany({ user: (0, helpers_1.castToObjectId)(userId), memory: memory._id }, { select: ["_id", "publicId"], limit: currentBatchSize });
        if (batch.length === 0)
            break;
        const publicIds = batch
            .map((image) => image.publicId)
            .filter((publicId) => publicId !== undefined);
        if (publicIds.length > 0) {
            await cloudinary_1.default.v2.api.delete_resources(publicIds, { invalidate: true });
        }
        const batchIds = batch.map((image) => image._id);
        await memory_image_repository_1.memoryImageRepository.deleteMany({}, { in: { _id: batchIds } });
        processedCount += batch.length;
    }
    return { count: processedCount };
}
