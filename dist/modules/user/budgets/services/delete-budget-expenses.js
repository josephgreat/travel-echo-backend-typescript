"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deleteBudgetExpenses;
const constants_1 = require("#src/utils/constants");
const cloudinary_1 = __importDefault(require("cloudinary"));
const expense_repository_1 = require("#src/db/repositories/expense.repository");
const helpers_1 = require("#src/utils/helpers");
async function deleteBudgetExpenses(budgetId) {
    if (!budgetId) {
        throw new Error("No budget ID provided");
    }
    let processedCount = 0;
    while (true) {
        const expenses = await expense_repository_1.expenseRepository.findMany({ budget: (0, helpers_1.castToObjectId)(budgetId) }, { limit: constants_1.PROCESSING_BATCH_SIZE });
        if (expenses.length === 0)
            break;
        const expenseIds = expenses.map((expense) => expense._id);
        const receiptsPublicIds = expenses
            .map((expense) => expense.receipt?.publicId)
            .filter((publicId) => Boolean(publicId));
        const promises = [expense_repository_1.expenseRepository.deleteMany({}, { in: { _id: expenseIds } })];
        if (receiptsPublicIds.length > 0) {
            promises.push(cloudinary_1.default.v2.api.delete_resources(receiptsPublicIds, { invalidate: true }));
        }
        await Promise.all(promises);
        processedCount += expenses.length;
        if (expenses.length < constants_1.PROCESSING_BATCH_SIZE)
            break;
    }
    return { count: processedCount };
}
