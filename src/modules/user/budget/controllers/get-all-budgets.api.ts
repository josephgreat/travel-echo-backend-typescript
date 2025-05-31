import { budgetRepository } from "#src/db/repositories/budget.repository";
import { api } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { GET_REQUEST_DATA_LIMIT } from "#src/utils/constants";

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
 * @use {Query}
 */

export default api(
  {
    group: "/users/me",
    path: "/budgets",
    method: "get"
  },
  defineHandler(async (req) => {
    const { id } = req.user!;

    const { sort, select, limit = GET_REQUEST_DATA_LIMIT, skip = 0 } = req.parsedQuery || {};

    const budgets = await budgetRepository.findMany(
      { user: id },
      { sort, select, limit, skip }
    );

    return { budgets };
  })
)
