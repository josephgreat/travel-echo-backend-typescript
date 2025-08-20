"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expense_repository_1 = require("#src/db/repositories/expense.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const zod_1 = require("zod");
const Schema = zod_1.z.object({
    title: zod_1.z.string({ message: "Title is required" }).optional(),
    category: zod_1.z.string({ message: "Category is required" }).optional(),
    plannedAmount: zod_1.z
        .number({ message: "Planned amount is required" })
        .min(0, { message: "Planned amount cannot be negative" })
        .optional(),
    actualAmount: zod_1.z
        .number({ message: "Invalid actual amount" })
        .min(0, { message: "Actual amount cannot be negative" })
        .optional(),
    notes: zod_1.z.string({ message: "Invalid notes" }).optional()
}, { message: "No request body provided" });
/**
 * @api {put} /users/me/expenses/:expense_id
 * @desc Updates the expense with the provided expense id
 * @domain {User: Expenses}
 * @use {ContentAuth}
 * @body {json}
 * {
 *  "budget": "string"
 *  "trip": "string | optiional",
 *  "title": "string",
 *  "category": "string",
 *  "plannedAmount": "number | optional",
 *  "actualAmount": "number",
 *  "notes": "string | optional"
 * }
 * @res {json}
 * {
 *   "success": true,
 *   "budget": {
 *     "_id": "string",
 *     "user": "string",
 *     "budget": "string",
 *     "trip": "string | optiional",
 *     "title": "string",
 *     "category": "string",
 *     "plannedAmount": "number | optional",
 *     "actualAmount": "number",
 *     "notes": "string | optional",
 *     "createdAt": "Date",
 *     "updatedAt": "Date"
 *   }
 * }
 */
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/expenses/:expense_id",
    method: "put",
    middleware: (0, handlers_1.defineValidator)("body", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const data = req.validatedBody;
    const { id } = req.user;
    const { expense_id } = req.params;
    try {
        const expense = await expense_repository_1.expenseRepository.updateUnique({ _id: expense_id, user: id, title: { value: data.title, forceUnique: true } }, { _id: expense_id, user: id }, data, { returning: true });
        if (!expense) {
            throw http_1.HttpException.notFound("Expense not found");
        }
        return {
            expense
        };
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.name === "DUPLICATE_FIELD_ERROR" ||
                error.name === "MAX_UNIQUE_VALUE_GENERATION_ERROR") {
                throw http_1.HttpException.badRequest("An expense with this title already exists.");
            }
        }
        throw error;
    }
}));
