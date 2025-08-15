import { earnedBadgeRepository } from "#src/db/repositories/earned-badge.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { GET_REQUEST_DATA_LIMIT } from "#src/utils/constants";

export default defineApi(
  { group: "/users/me", path: "/earned-badges", method: "get" },
  defineHandler(async (req) => {
    const { id } = req.user!;

    const {
      where,
      sort = { createdAt: -1 },
      select,
      limit = GET_REQUEST_DATA_LIMIT,
      skip = 0
    } = req.parsedQuery || {};

    const earnedBadges = await earnedBadgeRepository.findMany(
      { user: id },
      {
        populate: "badge",
        where,
        sort,
        select,
        limit,
        skip
      }
    );

    return { earnedBadges };
  })
);

/**
 * @api {get} /users/me/earned-badges
 * @desc Gets the badges earned by the user
 * @domain {User: Badges}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "earnedBadges": [
 *      {
 *       "_id": "64e5a320c41e2f5e8e1c29a8",
 *       "user": "64e5a320c41e2f5e8e1c29a8",
 *       "badge": {
 *          "_id": "64e5a320c41e2f5e8e1c29a8",
 *          "name": "string",
 *          "level": "number",
 *          "description": "string",
 *          "category": "TRIP | MEMORY...",
 *          "operator": "EQ | GT | LT | GTE | LTE",
 *          "value": "number"
 *        },
 *        "earnedAt": "Date"
 *      }
 *    ]
 * }
 * @use {Query}
 */
