"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.earnedBadgeRepository = exports.EarnedBadgeRepository = void 0;
const earned_badge_model_1 = require("../models/earned-badge.model");
const repository_1 = require("./repository");
class EarnedBadgeRepository extends repository_1.Repository {
    constructor() {
        super(earned_badge_model_1.EarnedBadgeModel);
    }
}
exports.EarnedBadgeRepository = EarnedBadgeRepository;
exports.earnedBadgeRepository = new EarnedBadgeRepository();
