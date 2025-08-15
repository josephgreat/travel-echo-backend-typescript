import { BudgetZodSchema, BudgetZodType } from "#src/db/models/budget.model";
import { budgetRepository } from "#src/db/repositories/budget.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";

export default defineApi(
  {
    group: "/users/me",
    path: "/budgets/:budget_id",
    method: "put",
    middleware: defineValidator("body", BudgetZodSchema)
  },
  defineHandler(async (req) => {
    const data = req.validatedBody as BudgetZodType;
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
