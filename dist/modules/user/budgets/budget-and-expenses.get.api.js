"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const budget_repository_1 = require("#src/db/repositories/budget.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const helpers_1 = require("#src/utils/helpers");
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const Schema = zod_1.z.object({
    budget_id: zod_1.z
        .string({ message: "Budget ID is requuired" })
        .refine((val) => (0, mongoose_1.isObjectIdOrHexString)(val), { message: "Invalid budget ID" })
});
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/budgets/:budget_id/expenses",
    method: "get",
    middleware: (0, handlers_1.defineValidator)("params", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const { budget_id } = req.params;
    const { skip, limit, populate, select } = req.parsedQuery || {};
    const result = await budget_repository_1.budgetRepository.findBudgetAndExpenses({
        _id: (0, helpers_1.castToObjectId)(budget_id),
        user: (0, helpers_1.castToObjectId)(id)
    }, { populate, select, skip, limit });
    const budget = result[0];
    if (!budget) {
        throw http_1.HttpException.notFound("Budget not found");
    }
    return { budget };
}));
/**
 * @api {get} /users/me/budgets/:budget_id/expenses
 * @desc Gets the budget and all its expenses
 * @domain {User: Budgets}
 * @use {Auth}
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
 *      "updatedAt": "Date",
 *      "expenses": [ {...}, {...} ]
 *    }
 * }
 * @par {populate?} @query e.g. populate=user
 * @par {select?} @query e.g. select=trip,plannedAmount
 */
