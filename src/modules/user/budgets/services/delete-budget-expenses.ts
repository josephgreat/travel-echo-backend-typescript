import { PROCESSING_BATCH_SIZE } from "#src/utils/constants";
import cloudinary from "cloudinary";
import { expenseRepository } from "#src/db/repositories/expense.repository";
import { castToObjectId } from "#src/utils/helpers";
import mongoose from "mongoose";

export default async function deleteBudgetExpenses(budgetId: string | mongoose.Types.ObjectId) {
  if (!budgetId) {
    throw new Error("No budget ID provided");
  }

  let processedCount = 0;

  while (true) {
    const expenses = await expenseRepository.findMany(
      { budget: castToObjectId(budgetId) },
      { limit: PROCESSING_BATCH_SIZE }
    );

    if (expenses.length === 0) break;

    const expenseIds = expenses.map((expense) => expense._id);
    const receiptsPublicIds = expenses
      .map((expense) => expense.receipt?.publicId)
      .filter((publicId): publicId is string => Boolean(publicId));

    const promises: unknown[] = [expenseRepository.deleteMany({}, { in: { _id: expenseIds } })];

    if (receiptsPublicIds.length > 0) {
      promises.push(cloudinary.v2.api.delete_resources(receiptsPublicIds, { invalidate: true }));
    }

    await Promise.all(promises);

    processedCount += expenses.length;

    if (expenses.length < PROCESSING_BATCH_SIZE) break;
  }

  return { count: processedCount };
}
