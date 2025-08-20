"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBadge = exports.getBadges = void 0;
const badge_model_1 = require("#src/db/models/badge.model");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
exports.getBadges = (0, api_1.defineApi)({
    path: "/badges"
}, (0, handlers_1.defineHandler)(async () => {
    const badges = await badge_model_1.BadgeModel.find().lean();
    return {
        badges
    };
}));
exports.createBadge = (0, api_1.defineApi)({
    path: "/badges",
    method: "post",
    middleware: (0, handlers_1.defineValidator)("body", badge_model_1.BadgeZodSchema)
}, (0, handlers_1.defineHandler)(async (req) => {
    const body = req.validatedBody;
    const existingBadge = await badge_model_1.BadgeModel.findOne({
        level: body.level,
        category: body.category
    }).lean();
    if (existingBadge) {
        throw http_1.HttpException.badRequest("Another badge with the same category and level already exists");
    }
    const created = await badge_model_1.BadgeModel.create(body);
    return {
        badge: created
    };
}));
