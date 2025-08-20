"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const earned_badge_repository_1 = require("#src/db/repositories/earned-badge.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const constants_1 = require("#src/utils/constants");
exports.default = (0, api_1.defineApi)({ group: "/users/me", path: "/earned-badges", method: "get" }, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const { where, sort = { createdAt: -1 }, select, limit = constants_1.GET_REQUEST_DATA_LIMIT, skip = 0 } = req.parsedQuery || {};
    const earnedBadges = await earned_badge_repository_1.earnedBadgeRepository.findMany({ user: id }, {
        populate: "badge",
        where,
        sort,
        select,
        limit,
        skip
    });
    return { earnedBadges };
}));
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
