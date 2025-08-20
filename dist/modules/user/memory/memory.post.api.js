"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memory_model_1 = require("#src/db/models/memory.model");
const memory_repository_1 = require("#src/db/repositories/memory.repository");
const milestone_repository_1 = require("#src/db/repositories/milestone.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const award_badge_if_eligible_1 = require("../badges/services/award-badge-if-eligible");
const badge_model_1 = require("#src/db/models/badge.model");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/memories",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", memory_model_1.MemoryZodSchema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const data = req.validatedBody;
    try {
        const milestone = await milestone_repository_1.milestoneRepository.findOrCreate({ user: id }, { user: id, totalBudgets: 0, totalMemories: 0, totalTrips: 0 });
        const [memory] = await Promise.all([
            memory_repository_1.memoryRepository.createUnique({ user: id, title: { value: data.title, forceUnique: true } }, { user: id, ...data }),
            milestone_repository_1.milestoneRepository.updateOne(milestone._id, {
                totalMemories: milestone.totalMemories + 1
            })
        ]);
        const { hasEarnedNewBadge, badge } = await (0, award_badge_if_eligible_1.awardBadgeIfEligible)(id, badge_model_1.BadgeCategory.Memory);
        return {
            memory,
            hasEarnedNewBadge,
            badge
        };
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.name === "DUPLICATE_FIELD_ERROR" ||
                error.name === "MAX_UNIQUE_VALUE_GENERATION_ERROR") {
                throw http_1.HttpException.badRequest("A memory with this title already exists.");
            }
        }
        throw error;
    }
}));
/**
 * @api {post} /users/me/memories
 * @desc Creates a new memory
 * @domain {User: Memories}
 * @use {ContentAuth}
 * @body {json}
 * {
 *  "title": "string | required",
 *  "description": "string | optional",
 *  "location": "string | optional",
 *  "date": "date | optional",
 *  "tags": "array of strings | optional",
 *  "isPublic": "boolean | optional | default true"
 * }
 * @res {json}
 * {
 *  "success": true,
 *  "hasEarnedNewBadge": "boolean",
 *  "badge": "badge info | null",
 *  "memory": {
 *    "_id": "65defc452caed3211ad24de4e",
 *    "title": "Hike to Mount Fuji",
 *    "description": "description of memory",
 *    "location": "Tokyo, Japan",
 *    "date": "2023-01-01",
 *    "tags": ["hiking", "nature"],
 *    "isPublic": true,
 *    "createdAt": "2023-01-01T00:00:00.000Z",
 *    "updatedAt": "2023-01-01T00:00:00.000Z"
 *  }
 * }
 */
