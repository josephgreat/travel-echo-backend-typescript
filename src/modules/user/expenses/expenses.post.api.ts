import { expenseRepository } from "#src/db/repositories/expense.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import mongoose from "mongoose";
import { z } from "zod";

const Schema = z.object(
  {
    budget: z
      .string({ message: "Budget ID is required" })
      .refine((val) => val === undefined || mongoose.isObjectIdOrHexString(val), {
        message: "Invalid Budget ID"
      })
      .transform((val) => new mongoose.Types.ObjectId(val)),
    trip: z
      .string({ message: "Invalid Trip ID" })
      .refine((val) => val === undefined || mongoose.isObjectIdOrHexString(val), {
        message: "Invalid Trip ID"
      })
      .transform((val) => new mongoose.Types.ObjectId(val))
      .optional(),
    title: z.string({ message: "Title is required" }),
    category: z.string({ message: "Category is required" }),
    plannedAmount: z
      .number({ message: "Planned amount is required" })
      .min(0, { message: "Planned amount cannot be negative" })
      .optional(),
    actualAmount: z
      .number({ message: "Invalid actual amount" })
      .min(0, { message: "Actual amount cannot be negative" })
      .optional(),
    notes: z.string({ message: "Invalid notes" }).optional()
  },
  { message: "No request body provided" }
);

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

export default defineApi(
  {
    group: "/users/me",
    path: "/expenses",
    method: "post",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const data = req.validatedBody as z.infer<typeof Schema>;
    const { id } = req.user!;

    try {
      const expense = await expenseRepository.createUnique(
        { user: id, title: { value: data.title, forceUnique: true } },
        { user: id, ...data }
      );

      return {
        expense
      };
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "DUPLICATE_FIELD_ERROR" ||
          error.name === "MAX_UNIQUE_VALUE_GENERATION_ERROR"
        ) {
          throw HttpException.badRequest("An expense with this title already exists.");
        }
      }
      throw error;
    }
  })
);
