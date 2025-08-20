"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const budget_model_1 = require("#src/db/models/budget.model");
const budget_repository_1 = require("#src/db/repositories/budget.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/budgets/:budget_id",
    method: "put",
    middleware: (0, handlers_1.defineValidator)("body", budget_model_1.BudgetZodSchema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const data = req.validatedBody;
    const { id } = req.user;
    const { budget_id } = req.params;
    const budget = await budget_repository_1.budgetRepository.updateOne({ _id: budget_id, user: id }, data, {
        returning: true
    });
    if (!budget) {
        throw http_1.HttpException.notFound("Budget not found");
    }
    return {
        budget
    };
}));
/**
 * @api {put} /users/me/budgets/:budget_id
 * @desc Updates the budget with the provided ID
 * @domain {User: Budgets}
 * @use {ContentAuth}
 * @body {json}
 * {...}
 * @res {json}
 * {
 *   "success": true,
 *   "budget": {
 *      "_id": "string",
 *      "user": "string",
 *      "trip": "string",
 *      "plannedAmount": "number",
 *      "spentAmount": "number",
 *      "currency": "string | optional",
 *      "notes": "string | optional",
 *      "createdAt": "Date",
 *     "updatedAt": "Date"
 *   }
 * }
 */
