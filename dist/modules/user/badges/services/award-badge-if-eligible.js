"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.awardBadgeIfEligible = awardBadgeIfEligible;
const badge_repository_1 = require("#src/db/repositories/badge.repository");
const earned_badge_repository_1 = require("#src/db/repositories/earned-badge.repository");
const milestone_repository_1 = require("#src/db/repositories/milestone.repository");
const helpers_1 = require("#src/utils/helpers");
const check_eligibility_1 = __importDefault(require("./check-eligibility"));
const badge_milestone_map_1 = __importDefault(require("./badge-milestone-map"));
/**
 * Checks if a user has earned a new badge in a given category.
 * Awards the badge if eligible.
 */
async function awardBadgeIfEligible(userId, category) {
    const userObjectId = (0, helpers_1.castToObjectId)(userId);
    // 1. Get milestone
    const milestone = await milestone_repository_1.milestoneRepository.findOrCreate({ user: userObjectId }, { user: userObjectId });
    const currentValue = milestone[badge_milestone_map_1.default[category]];
    // 2. Get earned badges
    const earnedBadges = await earned_badge_repository_1.earnedBadgeRepository.findMany({ user: userObjectId });
    const earnedBadgeIds = earnedBadges.map((b) => b.badge.toString());
    // 3. Get badges for the category, sorted by level
    const badges = await badge_repository_1.badgeRepository.findMany({ category }, { sort: { level: 1 } });
    // 4. Find the first eligible badge the user hasn’t earned yet
    for (const badge of badges) {
        if (earnedBadgeIds.includes(badge._id.toString()))
            continue;
        if ((0, check_eligibility_1.default)(currentValue, badge.operator, badge.value)) {
            // Award the badge
            await earned_badge_repository_1.earnedBadgeRepository.create({
                user: userObjectId,
                badge: badge._id,
                earnedAt: new Date()
            });
            return { hasEarnedNewBadge: true, badge };
        }
    }
    // No new badge earned
    return { hasEarnedNewBadge: false, badge: null };
}
