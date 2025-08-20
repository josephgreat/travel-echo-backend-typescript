"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextLevelBadgesWithProgress = getNextLevelBadgesWithProgress;
const badge_model_1 = require("#src/db/models/badge.model");
const milestone_repository_1 = require("#src/db/repositories/milestone.repository");
const helpers_1 = require("#src/utils/helpers");
const calculate_progress_1 = __importDefault(require("./calculate-progress"));
const badge_milestone_map_1 = __importDefault(require("./badge-milestone-map"));
const earned_badge_model_1 = require("#src/db/models/earned-badge.model");
async function getNextLevelBadgesWithProgress(userId) {
    const userObjectId = (0, helpers_1.castToObjectId)(userId);
    // 1. Get user's milestone
    const milestone = await milestone_repository_1.milestoneRepository.findOrCreate({ user: userObjectId }, { user: userObjectId });
    // 2. Get earned badges
    const earnedBadges = (await earned_badge_model_1.EarnedBadgeModel.find({
        user: userObjectId
    })
        .sort({ level: 1 })
        .populate("badge"));
    const groupedBadges = earnedBadges.reduce((acc, earnedBadge) => {
        const badge = earnedBadge.badge;
        acc[badge.category] = acc[badge.category] ?? [];
        acc[badge.category].push(earnedBadge);
        return acc;
    }, {});
    const categories = [
        badge_model_1.BadgeCategory.Budget,
        badge_model_1.BadgeCategory.Memory,
        badge_model_1.BadgeCategory.Trip
    ];
    const results = {};
    for (const category of categories) {
        let nextBadge = null;
        const highestLevelEarnedBadge = groupedBadges[category]?.at(-1);
        if (!highestLevelEarnedBadge) {
            nextBadge = await badge_model_1.BadgeModel.findOne({ category, level: 1 });
        }
        else {
            nextBadge = await badge_model_1.BadgeModel.findOne({
                category,
                level: highestLevelEarnedBadge.badge.level + 1
            });
        }
        if (!nextBadge) {
            continue;
        }
        const currentValue = milestone[badge_milestone_map_1.default[category]];
        const requiredValue = nextBadge?.value ?? 0;
        const percentageProgress = (0, calculate_progress_1.default)(currentValue, nextBadge?.operator, requiredValue);
        results[category] = {
            highestEarnedBadge: highestLevelEarnedBadge?.badge ?? null,
            nextLevelBadge: nextBadge,
            currentValue,
            requiredValue,
            percentageProgress
        };
    }
    return results;
}
