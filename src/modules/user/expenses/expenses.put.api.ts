import { expenseRepository } from "#src/db/repositories/expense.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { z } from "zod";

const Schema = z.object(
  {
    title: z.string({ message: "Title is required" }).optional(),
    category: z.string({ message: "Category is required" }).optional(),
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

export default defineApi(
  {
    group: "/users/me",
    path: "/expenses/:expense_id",
    method: "put",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const data = req.validatedBody as z.infer<typeof Schema>;
    const { id } = req.user!;
    const { expense_id } = req.params;

    try {
      const expense = await expenseRepository.updateUnique(
        { _id: expense_id, user: id, title: { value: data.title, forceUnique: true } },
        { _id: expense_id, user: id },
        data,
        { returning: true }
      );

      if (!expense) {
        throw HttpException.notFound("Expense not found");
      }

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
