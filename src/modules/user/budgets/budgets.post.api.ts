import { BadgeCategory } from "#src/db/models/badge.model";
import { BudgetZodSchema, BudgetZodType } from "#src/db/models/budget.model";
import { budgetRepository } from "#src/db/repositories/budget.repository";
import { milestoneRepository } from "#src/db/repositories/milestone.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { awardBadgeIfEligible } from "../badges/services/award-badge-if-eligible";

export default defineApi(
  {
    group: "/users/me",
    path: "/budgets",
    method: "post",
    middleware: defineValidator("body", BudgetZodSchema)
  },
  defineHandler(async (req) => {
    const data = req.validatedBody as BudgetZodType;
    const { id } = req.user!;

    const milestone = await milestoneRepository.findOrCreate({ user: id }, { user: id });

    const [budget] = await Promise.all([
      budgetRepository.create({
        user: id,
        ...data
      }),

      milestoneRepository.updateOne(milestone._id, { totalBudgets: milestone.totalBudgets + 1 })
    ]);

    const { hasEarnedNewBadge, badge } = await awardBadgeIfEligible(id, BadgeCategory.Budget);

    return {
      budget,
      hasEarnedNewBadge,
      badge
    };
  })
);

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
