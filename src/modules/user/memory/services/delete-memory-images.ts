import { memoryRepository } from "#src/db/repositories/memory.repository";
import { PROCESSING_BATCH_SIZE } from "#src/utils/constants";
import mongoose from "mongoose";
import { memoryImageRepository } from "#src/db/repositories/memory-image.repository";
import { castToObjectId } from "#src/utils/helpers";
import cloudinary from "cloudinary";

export default async function deleteMemoryImages(
  userId: string | mongoose.Types.ObjectId,
  memory: Awaited<ReturnType<typeof memoryRepository.findOne>>,
  count: number | "all"
) {
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
    const currentBatchSize = Math.min(PROCESSING_BATCH_SIZE, remaining);

    const batch = await memoryImageRepository.findMany(
      { user: castToObjectId(userId), memory: memory._id },
      { select: ["_id", "publicId"], limit: currentBatchSize }
    );

    if (batch.length === 0) break;

    const publicIds = batch
      .map((image) => image.publicId)
      .filter((publicId) => publicId !== undefined);

    if (publicIds.length > 0) {
      await cloudinary.v2.api.delete_resources(publicIds, { invalidate: true });
    }

    const batchIds = batch.map((image) => image._id);
    await memoryImageRepository.deleteMany({}, { in: { _id: batchIds } });

    processedCount += batch.length;
  }
  return { count: processedCount };
}
