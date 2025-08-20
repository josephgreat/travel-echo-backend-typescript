"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleBudget = exports.getAllBudgets = void 0;
const budget_repository_1 = require("#src/db/repositories/budget.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
exports.getAllBudgets = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/budgets",
    method: "get"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const { populate, where, sort, select, limit, skip = 0 } = req.parsedQuery || {};
    const budgets = await budget_repository_1.budgetRepository.findMany({ user: id, ...where }, { populate, sort, select, limit, skip });
    return { budgets };
}));
/**
 * @api {get} /users/me/budgets
 * @desc Gets all the budgets of the user
 * @domain {User: Budgets}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "budgets": [
 *      {
 *       "_id": "string",
 *       "user": "string",
 *       "trip": "string",
 *       "plannedAmount": "number",
 *       "spentAmount": "number",
 *       "currency": "string | optional",
 *       "notes": "string | optional",
 *       "createdAt": "Date",
 *       "updatedAt": "Date"
 *     }
 *   ]
 * }
 * @par {where?} @query e.g where=budget,budget_id
 * @use {Query}
 */
/**
 * Get single budget
 */
const Schema = zod_1.z.object({
    budget_id: zod_1.z
        .string({ message: "Budget ID is requuired" })
        .refine((val) => (0, mongoose_1.isObjectIdOrHexString)(val), { message: "Invalid budget ID" })
});
exports.getSingleBudget = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/budgets/:budget_id",
    method: "get",
    middleware: (0, handlers_1.defineValidator)("params", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const { budget_id } = req.params;
    const { populate, select } = req.parsedQuery || {};
    const budget = await budget_repository_1.budgetRepository.findOne({ _id: budget_id, user: id }, { populate, select });
    if (!budget) {
        throw http_1.HttpException.notFound("Budget not found");
    }
    return { budget };
}));
/**
 * @api {get} /users/me/budgets/:budget_id
 * @desc Gets the user's budget with the provided ID
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
 *      "updatedAt": "Date"
 *    }
 * }
 * @par {populate?} @query e.g. populate=user
 * @par {where?} @query e.g. where=currency,USD
 * @par {select?} @query e.g. select=trip,plannedAmount
 */
