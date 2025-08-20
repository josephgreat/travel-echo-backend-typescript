"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleExpense = exports.getAllExpenses = void 0;
const expense_repository_1 = require("#src/db/repositories/expense.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
/**
 * @api {get} /users/me/expenses
 * @desc Gets all the expenses of the user
 * @domain {User: Expenses}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "expenses": [
 *      {
 *       "_id": "string",
 *       "user": "string",
 *       "budget": "string | optional",
 *       "trip": "string | optional",
 *       "category": "string",
 *       "plannedAmount": "number",
 *       "actualAmount": "number",
 *       "notes": "string | optional",
 *       "receiptImageUrl": "string | optional",
 *       "createdAt": "Date",
 *       "updatedAt": "Date"
 *     }
 *   ]
 * }
 * @par {where?} @query e.g where=budget,budget_id
 * @use {Query}
 */
exports.getAllExpenses = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/expenses",
    method: "get"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    //expenses do not have a forced limit
    const { populate, where, sort, select, limit, skip = 0 } = req.parsedQuery || {};
    const expenses = await expense_repository_1.expenseRepository.findMany({ user: id, ...where }, { populate, sort, select, limit, skip });
    return { expenses };
}));
/**
 * @api {get} /users/me/expenses/:expense_id
 * @desc Gets the user's expense with the expense_id
 * @domain {User: Expenses}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "expense": {
 *      "_id": "string",
 *      "user": "string",
 *      "budget": "string | optional",
 *      "trip": "string | optional",
 *      "category": "string",
 *      "plannedAmount": "number",
 *      "actualAmount": "number",
 *      "notes": "string | optional",
 *      "receiptImageUrl": "string | optional",
 *      "createdAt": "Date",
 *      "updatedAt": "Date"
 *    }
 * }
 * @par {select?} @query e.g select=plannedAmount,notes
 * @par {populate?} @query e.g populate=user
 */
const Schema = zod_1.z.object({
    expense_id: zod_1.z
        .string({ message: "Expense ID is requuired" })
        .refine((val) => (0, mongoose_1.isObjectIdOrHexString)(val), { message: "Invalid expense ID" })
});
exports.getSingleExpense = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/expenses/:expense_id",
    method: "get",
    middleware: (0, handlers_1.defineValidator)("params", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const { expense_id } = req.params;
    const { populate, select } = req.parsedQuery || {};
    const expenses = await expense_repository_1.expenseRepository.findOne({ _id: expense_id, user: id }, { populate, select });
    return { expenses };
}));
