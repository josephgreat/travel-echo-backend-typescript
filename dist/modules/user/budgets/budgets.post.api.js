"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const badge_model_1 = require("#src/db/models/badge.model");
const budget_model_1 = require("#src/db/models/budget.model");
const budget_repository_1 = require("#src/db/repositories/budget.repository");
const milestone_repository_1 = require("#src/db/repositories/milestone.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const award_badge_if_eligible_1 = require("../badges/services/award-badge-if-eligible");
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/budgets",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", budget_model_1.BudgetZodSchema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const data = req.validatedBody;
    const { id } = req.user;
    const milestone = await milestone_repository_1.milestoneRepository.findOrCreate({ user: id }, { user: id, totalBudgets: 0, totalMemories: 0, totalTrips: 0 });
    const [budget] = await Promise.all([
        budget_repository_1.budgetRepository.create({
            user: id,
            ...data
        }),
        milestone_repository_1.milestoneRepository.updateOne(milestone._id, {
            totalBudgets: (milestone.totalBudgets ?? 0) + 1
        })
    ]);
    const { hasEarnedNewBadge, badge } = await (0, award_badge_if_eligible_1.awardBadgeIfEligible)(id, badge_model_1.BadgeCategory.Budget);
    return {
        budget,
        hasEarnedNewBadge,
        badge
    };
}));
/**
 * @api {post} /users/me/budgets
 * @desc Creates a new budget
 * @domain {User: Budgets}
 * @use {ContentAuth}
 * @body {json}
 * {...}
 * @res {json}
 * {
 *   "success": true,
 *   "hasEarnedNewBadge": "boolean",
 *   "badge": "badge info | null",
 *   "budget": {
 *      "_id": "string",
 *      "user": "string",
 *      "trip": "string",
 *      "plannedAmount": "number",
 *      "spentAmount": "number",
 *      "currency": "string | optional",
 *      "notes": "string | optional",
 *      "createdAt": "Date",
 *     "updatedAt": "Date"
 *   }
 * }
 */
