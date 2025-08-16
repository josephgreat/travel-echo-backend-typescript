import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { getNextLevelBadgesWithProgress } from "./services/get-next-level-badges";

export default defineApi(
  { group: "/users/me", path: "/next-level-badges", method: "get" },
  defineHandler(async (req) => {
    const { id } = req.user!;

    const results = await getNextLevelBadgesWithProgress(id);

    console.log(results);

    return {
      data: results
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
 *   "data": {
 *     "MEMORY": {
 *       "highestEarnedBadge": "Badge | null",
 *       "nextLevelBadge": "Badge",
 *       "currentValue": "number",
 *       "requiredValue": "number",
 *       "percentageProgress": "number"
 *     }
 *   }
 * }
 * @use {Query}
 */
