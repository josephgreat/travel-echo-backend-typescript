import { budgetRepository } from "#src/db/repositories/budget.repository";
import { api } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { z } from "zod";

const Schema = z.object(
  {
    name: z.string({ message: "Name must be a string" }).optional(),
    plannedAmount: z
      .number({ message: "Planned amount must be a number" })
      .min(0, { message: "Planned amount cannot be negative" })
      .optional(),
    spentAmount: z
      .number({ message: "Spent amount must be a number" })
      .min(0, { message: "Spent amount cannot be negative" })
      .optional(),
    currency: z.string({ message: "Invalid currency" }).optional(),
    notes: z.string({ message: "Invalid notes" }).optional()
  },
  { message: "No request body provided" }
);

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

export default api(
  {
    group: "/users/me",
    path: "/budgets/:budget_id",
    method: "put",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const data = req.body as z.infer<typeof Schema>;
    const { id } = req.user!;
    const { budget_id } = req.params;

    const budget = await budgetRepository.updateOne({ _id: budget_id, user: id }, data, {
      returning: true
    });

    if (!budget) {
      throw HttpException.notFound("Budget not found");
    }

    return {
      budget
    };
  })
);
