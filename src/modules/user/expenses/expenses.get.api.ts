import { expenseRepository } from "#src/db/repositories/expense.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { isObjectIdOrHexString } from "mongoose";
import { z } from "zod";

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

export const getAllExpenses = defineApi(
  {
    group: "/users/me",
    path: "/expenses",
    method: "get"
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    //expenses do not have a forced limit
    const { populate, where, sort, select, limit, skip = 0 } = req.parsedQuery || {};

    const expenses = await expenseRepository.findMany(
      { user: id, ...where },
      { populate, sort, select, limit, skip }
    );

    return { expenses };
  })
);

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

const Schema = z.object({
  expense_id: z
    .string({ message: "Expense ID is requuired" })
    .refine((val) => isObjectIdOrHexString(val), { message: "Invalid expense ID" })
});

export const getSingleExpense = defineApi(
  {
    group: "/users/me",
    path: "/expenses/:expense_id",
    method: "get",
    middleware: defineValidator("params", Schema)
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const { expense_id } = req.params;

    const { populate, select } = req.parsedQuery || {};

    const expenses = await expenseRepository.findOne(
      { _id: expense_id, user: id },
      { populate, select }
    );

    return { expenses };
  })
);
