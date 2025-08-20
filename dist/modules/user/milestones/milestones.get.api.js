"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const milestone_repository_1 = require("#src/db/repositories/milestone.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "milestones",
    method: "get"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const { select, populate } = req.parsedQuery || {};
    const milestones = await milestone_repository_1.milestoneRepository.findOrCreate({ user: id }, { user: id, totalMemories: 0, totalTrips: 0, totalBudgets: 0 }, { populate, select });
    return {
        milestones
    };
}));
/**
 * @api {get} /users/me/milestones
 * @desc Gets user's milestones
 * @domain {User: Milestones}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "milestones": {
 *      "_id": "64e5a320c41e2f5e8e1c29a8",
 *      "user": "64e5a320c41e2f5e8e1c29a8",
 *      "totalTrips": "number",
 *      "totalMemories": "number"
 *    }
 * }
 * @par {select?} @query e.g. select=totalMemories
 * @par {populate?} @query e.g. populate=user
 */
