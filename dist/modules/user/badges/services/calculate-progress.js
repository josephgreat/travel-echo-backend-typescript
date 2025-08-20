"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = calculateProgress;
const badge_model_1 = require("#src/db/models/badge.model");
function calculateProgress(current, operator, target) {
    switch (operator) {
        case badge_model_1.BadgeOperator.EQ:
        case badge_model_1.BadgeOperator.GTE:
            return Math.min(100, (current / target) * 100);
        case badge_model_1.BadgeOperator.GT:
            return Math.min(100, (current / (target + 1)) * 100);
        case badge_model_1.BadgeOperator.LTE:
        case badge_model_1.BadgeOperator.LT:
            // For "less than" style, progress is weird — treat as reverse target
            return current < target ? 100 : 0;
        default:
            return 0;
    }
}
