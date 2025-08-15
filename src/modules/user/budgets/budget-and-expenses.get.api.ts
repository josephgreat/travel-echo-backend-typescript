import { budgetRepository } from "#src/db/repositories/budget.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { castToObjectId } from "#src/utils/helpers";
import { isObjectIdOrHexString } from "mongoose";
import { z } from "zod";

const Schema = z.object({
  budget_id: z
    .string({ message: "Budget ID is requuired" })
    .refine((val) => isObjectIdOrHexString(val), { message: "Invalid budget ID" })
});

export default defineApi(
  {
    group: "/users/me",
    path: "/budgets/:budget_id/expenses",
    method: "get",
    middleware: defineValidator("params", Schema)
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const { budget_id } = req.params;
    const { skip, limit, populate, select } = req.parsedQuery || {};

    const result = await budgetRepository.findBudgetAndExpenses(
      {
        _id: castToObjectId(budget_id),
        user: castToObjectId(id)
      },
      { populate, select, skip, limit }
    );

    const budget = result[0];

    if (!budget) {
      throw HttpException.notFound("Budget not found");
    }

    return { budget };
  })
);

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
