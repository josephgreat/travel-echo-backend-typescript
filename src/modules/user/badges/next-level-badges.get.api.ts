import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { getNextLevelBadgesWithProgress } from "./services/get-next-level-badges";

export default defineApi(
  { group: "/users/me", path: "/next-level-badges", method: "get" },
  defineHandler(async (req) => {
    const { id } = req.user!;

    const results = getNextLevelBadgesWithProgress(id);

    return {
      badges: results
    };
  })
);

/**
 * @api {get} /users/me/next-level-badges
 * @desc Gets badges on the next level higher than the user's current badges.
 * @domain {User: Badges}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "badges": [
 *      {
 *       "_id": "64e5a320c41e2f5e8e1c29a8",
 *       "category": "MEMORY | TRIP | BUDGET",
 *       "nextBadge": {
 *          "_id": "64e5a320c41e2f5e8e1c29a8",
 *          "name": "string",
 *          "level": "number",
 *          "description": "string",
 *          "category": "TRIP | MEMORY...",
 *          "operator": "EQ | GT | LT | GTE | LTE",
 *          "value": "number"
 *        },
 *        "percentageProgress": 40
 *      }
 *    ]
 * }
 * @use {Query}
 */
