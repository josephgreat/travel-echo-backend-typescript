"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expense_repository_1 = require("#src/db/repositories/expense.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const cloudinary_1 = __importDefault(require("cloudinary"));
/**
 * @api {delete} /users/me/expenses/:expense_id/receipt
 * @domain {User: Expenses}
 * @desc Deletes the expense receipt
 * @use {Auth}
 * @res {json} { "success": true, "message": "Expense receipt deleted successfully" }
 */
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/expenses/:expense_id/receipt",
    method: "delete"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const { expense_id } = req.params;
    const expense = await expense_repository_1.expenseRepository.findOne({ _id: expense_id, user: id });
    if (!expense) {
        throw http_1.HttpException.notFound("Expense not found");
    }
    const { receipt } = expense;
    if (!receipt) {
        return http_1.HttpException.notFound("No previous receipt image");
    }
    try {
        await cloudinary_1.default.v2.uploader.destroy(receipt.publicId, { invalidate: true });
        await cloudinary_1.default.v2.api.delete_folder(`${constants_1.CLOUDINARY_BUDGET_FOLDER}/${expense.budget.toString()}`);
        await expense_repository_1.expenseRepository.updateOne({ _id: expense_id, user: id }, { receipt: undefined });
        return {
            success: true,
            message: "Profile image removed succesfully"
        };
    }
    catch (error) {
        throw http_1.HttpException.internal(`Failed to delete image: ${error.message}`);
    }
}));
