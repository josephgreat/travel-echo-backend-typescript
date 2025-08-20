"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextEligibleBadge = getNextEligibleBadge;
exports.getNextEligibleBadges = getNextEligibleBadges;
const badge_model_1 = require("#src/db/models/badge.model");
const badge_repository_1 = require("#src/db/repositories/badge.repository");
const earned_badge_repository_1 = require("#src/db/repositories/earned-badge.repository");
const milestone_repository_1 = require("#src/db/repositories/milestone.repository");
const helpers_1 = require("#src/utils/helpers");
const mongoose_1 = require("mongoose");
const check_eligibility_1 = __importDefault(require("./check-eligibility"));
const badge_milestone_map_1 = __importDefault(require("./badge-milestone-map"));
async function getNextEligibleBadge(userId, category) {
    const userObjectId = (0, helpers_1.castToObjectId)(userId);
    // 1. Get user's milestone
    const milestone = await milestone_repository_1.milestoneRepository.findOrCreate({ user: userObjectId }, { user: userObjectId });
    const currentValue = milestone[badge_milestone_map_1.default[category]];
    // 2. Get earned badge IDs
    const earnedBadges = await earned_badge_repository_1.earnedBadgeRepository.findMany({ user: userObjectId });
    const earnedBadgeIds = earnedBadges.map((b) => b.badge.toString());
    // 3. Get badges in category, sorted by level
    const badges = await badge_repository_1.badgeRepository.findMany({ category }, { sort: { level: 1 } });
    // 4. Filter out already earned & check eligibility
    for (const badge of badges) {
        if (earnedBadgeIds.includes(badge._id.toString()))
            continue;
        const eligible = (0, check_eligibility_1.default)(currentValue, badge.operator, badge.value);
        if (eligible)
            return badge;
    }
    return null;
}
async function getNextEligibleBadges(userId) {
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    // 1. Get user's milestone
    const milestone = await milestone_repository_1.milestoneRepository.findOrCreate({ user: userObjectId }, { user: userObjectId });
    // 2. Get earned badges
    const earnedBadges = await earned_badge_repository_1.earnedBadgeRepository.findMany({ user: userObjectId });
    const earnedBadgeIds = earnedBadges.map((b) => b.badge.toString());
    // 3. Prepare result object
    const results = {};
    // 4. Loop through both categories
    for (const category of [badge_model_1.BadgeCategory.Trip, badge_model_1.BadgeCategory.Memory]) {
        const currentValue = milestone[badge_milestone_map_1.default[category]];
        const badges = await badge_repository_1.badgeRepository.findMany({ category }, { sort: { level: 1 } });
        for (const badge of badges) {
            if (earnedBadgeIds.includes(badge._id.toString()))
                continue;
            if ((0, check_eligibility_1.default)(currentValue, badge.operator, badge.value)) {
                results[category] = badge;
                break;
            }
        }
    }
    return results;
}
