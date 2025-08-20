"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMultipleExpenses = exports.deleteSingleExpense = void 0;
const expense_repository_1 = require("#src/db/repositories/expense.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const cloudinary_1 = __importDefault(require("cloudinary"));
const zod_1 = require("zod");
exports.deleteSingleExpense = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/expenses/:expense_id",
    method: "delete"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { expense_id } = req.params;
    const expense = await expense_repository_1.expenseRepository.findById(expense_id);
    if (!expense) {
        throw http_1.HttpException.notFound("Expense not found");
    }
    const promises = [];
    promises.push(expense_repository_1.expenseRepository.deleteOne(expense._id));
    if (expense.receipt) {
        promises.push(cloudinary_1.default.v2.uploader.destroy(expense.receipt.publicId, { invalidate: true }));
    }
    return {
        message: "Expense deleted successfully"
    };
}));
/**
 * @api {delete} /users/me/expenses/:expense_id
 * @desc Deletes an expense and its receipt if it exists
 * @domain {User: Expenses}
 * @header {Authorization} Bearer <token>
 * @par {expense_id} @path The expense ID
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Expense deleted successfully",
 * }
 */
const Schema = zod_1.z
    .array(zod_1.z.string({ message: "Expense ID is required" }), { message: "No expense IDs provided" })
    .max(constants_1.PROCESSING_BATCH_SIZE, {
    message: `Only ${constants_1.PROCESSING_BATCH_SIZE} expense IDs are allowed at a time`
});
exports.deleteMultipleExpenses = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/expenses/delete",
    method: "patch",
    middleware: (0, handlers_1.defineValidator)("body", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const expenseIds = req.validatedBody;
    const expenses = await expense_repository_1.expenseRepository.raw().find({ _id: { $in: expenseIds } });
    if (expenses.length === 0) {
        throw http_1.HttpException.notFound("No expenses found");
    }
    const receiptsPublicIds = expenses
        .map((expense) => expense.receipt?.publicId)
        .filter((publicId) => publicId !== undefined);
    const promises = [
        expense_repository_1.expenseRepository.deleteMany({}, { in: { _id: expenseIds } })
    ];
    if (receiptsPublicIds.length > 0) {
        promises.push(cloudinary_1.default.v2.api.delete_resources(receiptsPublicIds, { invalidate: true }));
    }
    const [result] = await Promise.all(promises);
    return {
        message: "Expenses deleted successfully",
        expensesDeleted: result.deletedCount
    };
}));
/**
 * @api {patch} /users/me/expenses/delete
 * @desc Deletes a list of expenses
 * @domain {User: Expenses}
 * @header {Authorization} Bearer <token>
 * @bodyDesc {A list of not more than 100 expense IDs}
 * @body {json} ["id_1", "id_2", "..."]
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Expense deleted successfully",
 *  "expensesDeleted": "number"
 * }
 */
