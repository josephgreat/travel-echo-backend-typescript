"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.badgeRepository = exports.BadgeRepository = void 0;
const badge_model_1 = require("../models/badge.model");
const repository_1 = require("./repository");
class BadgeRepository extends repository_1.Repository {
    constructor() {
        super(badge_model_1.BadgeModel);
    }
}
exports.BadgeRepository = BadgeRepository;
exports.badgeRepository = new BadgeRepository();
