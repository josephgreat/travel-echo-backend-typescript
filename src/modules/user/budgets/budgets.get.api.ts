import { budgetRepository } from "#src/db/repositories/budget.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { isObjectIdOrHexString } from "mongoose";
import { z } from "zod";

export const getAllBudgets = defineApi(
  {
    group: "/users/me",
    path: "/budgets",
    method: "get"
  },
  defineHandler(async (req) => {
    const { id } = req.user!;

    const { populate, where, sort, select, limit, skip = 0 } = req.parsedQuery || {};

    const budgets = await budgetRepository.findMany(
      { user: id, ...where },
      { populate, sort, select, limit, skip }
    );

    return { budgets };
  })
);

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
const Schema = z.object({
  budget_id: z
    .string({ message: "Budget ID is requuired" })
    .refine((val) => isObjectIdOrHexString(val), { message: "Invalid budget ID" })
});

export const getSingleBudget = defineApi(
  {
    group: "/users/me",
    path: "/budgets/:budget_id",
    method: "get",
    middleware: defineValidator("params", Schema)
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const { budget_id } = req.params;
    const { populate, select } = req.parsedQuery || {};

    const budget = await budgetRepository.findOne(
      { _id: budget_id, user: id },
      { populate, select }
    );

    if (!budget) {
      throw HttpException.notFound("Budget not found");
    }

    return { budget };
  })
);

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
