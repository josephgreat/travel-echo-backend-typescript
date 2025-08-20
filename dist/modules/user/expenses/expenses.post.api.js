"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expense_repository_1 = require("#src/db/repositories/expense.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const Schema = zod_1.z.object({
    budget: zod_1.z
        .string({ message: "Budget ID is required" })
        .refine((val) => val === undefined || mongoose_1.default.isObjectIdOrHexString(val), {
        message: "Invalid Budget ID"
    })
        .transform((val) => new mongoose_1.default.Types.ObjectId(val)),
    trip: zod_1.z
        .string({ message: "Invalid Trip ID" })
        .refine((val) => val === undefined || mongoose_1.default.isObjectIdOrHexString(val), {
        message: "Invalid Trip ID"
    })
        .transform((val) => new mongoose_1.default.Types.ObjectId(val))
        .optional(),
    title: zod_1.z.string({ message: "Title is required" }),
    category: zod_1.z.string({ message: "Category is required" }),
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
 * @api {post} /users/me/expenses
 * @desc Creates a new expense
 * @domain {User: Expenses}
 * @use {ContentAuth}
 * @body {json}
 * { ... }
 * @res {json}
 * {
 *   "success": true,
 *   "expense": {
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
    path: "/expenses",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", Schema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const data = req.validatedBody;
    const { id } = req.user;
    try {
        const expense = await expense_repository_1.expenseRepository.createUnique({ user: id, title: { value: data.title, forceUnique: true } }, { user: id, ...data });
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
