import { budgetRepository } from "#src/db/repositories/budget.repository";
import { api } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

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

export default api(
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
)
