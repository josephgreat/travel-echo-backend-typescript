"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const budget_repository_1 = require("#src/db/repositories/budget.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const constants_1 = require("#src/utils/constants");
const delete_budget_expenses_1 = __importDefault(require("./services/delete-budget-expenses"));
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/budgets/:budget_id",
    method: "delete"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { budget_id } = req.params;
    const budget = await budget_repository_1.budgetRepository.findById(budget_id);
    if (!budget) {
        throw http_1.HttpException.notFound("Budget not found");
    }
    const { count } = await (0, delete_budget_expenses_1.default)(budget._id);
    await Promise.all([
        budget_repository_1.budgetRepository.deleteOne(budget._id),
        cloudinary_1.default.v2.api.delete_folder(`${constants_1.CLOUDINARY_BUDGET_FOLDER}/${budget_id}`)
    ]);
    return {
        expensesDeleted: count,
        message: "Budget and all expenses deleted successfully"
    };
}));
/**
 * @api {delete} /users/me/budgets/:budget_id
 * @desc Deletes a budget and all its expenses
 * @domain {User: Budgets}
 * @header {Authorization} Bearer <token>
 * @par {budget_id} @path The budget ID
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Budget and all expenses deleted successfully",
 *  "expensesDeleted": "number"
 * }
 */
