import { BudgetZodSchema, BudgetZodType } from "#src/db/models/budget.model";
import { budgetRepository } from "#src/db/repositories/budget.repository";
import { api } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";

export default api(
  {
    group: "/users/me",
    path: "/budgets",
    method: "post",
    middleware: defineValidator("body", BudgetZodSchema)
  },
  defineHandler(async (req) => {
    const data = req.validatedBody as BudgetZodType;
    const { id } = req.user!;

    const budget = await budgetRepository.create({
      user: id,
      ...data
    });

    return {
      budget
    };
  })
);

/**
 * @api {post} /users/me/budgets
 * @desc Creates a new budget
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
