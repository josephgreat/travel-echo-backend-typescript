"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const get_next_level_badges_1 = require("./services/get-next-level-badges");
exports.default = (0, api_1.defineApi)({ group: "/users/me", path: "/next-level-badges", method: "get" }, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const results = await (0, get_next_level_badges_1.getNextLevelBadgesWithProgress)(id);
    console.log(results);
    return {
        data: results
    };
}));
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
