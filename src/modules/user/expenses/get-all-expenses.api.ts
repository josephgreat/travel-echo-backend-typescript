import { expenseRepository } from "#src/db/repositories/expense.repository";
import { api } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

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

export default api(
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
)
