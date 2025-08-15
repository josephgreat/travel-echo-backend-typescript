import { milestoneRepository } from "#src/db/repositories/milestone.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

export default defineApi(
  {
    group: "/users/me",
    path: "milestones",
    method: "get"
  },
  defineHandler(async (req) => {
    const { id } = req.user!;

    const { select, populate } = req.parsedQuery || {};

    const milestones = await milestoneRepository.findOrCreate(
      { user: id },
      { user: id, totalMemories: 0, totalTrips: 0 },
      { populate, select }
    );

    return {
      milestones
    };
  })
);

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
