"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkEligibility;
const badge_model_1 = require("#src/db/models/badge.model");
function checkEligibility(userValue, operator, requiredValue) {
    switch (operator) {
        case badge_model_1.BadgeOperator.EQ:
            return userValue === requiredValue;
        case badge_model_1.BadgeOperator.GT:
            return userValue > requiredValue;
        case badge_model_1.BadgeOperator.GTE:
            return userValue >= requiredValue;
        case badge_model_1.BadgeOperator.LT:
            return userValue < requiredValue;
        case badge_model_1.BadgeOperator.LTE:
            return userValue <= requiredValue;
        default:
            return false;
    }
}
