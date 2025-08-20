"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = internalOnly;
const env_1 = __importDefault(require("#src/utils/env"));
const constants_1 = require("./../utils/constants");
function internalOnly(req, res, next) {
    const internalSecret = req.get("X-Internal-Secret");
    const timestamp = req.get("X-Timestamp");
    const now = Date.now();
    const requestTime = Number(timestamp);
    if (isNaN(requestTime) || Math.abs(now - requestTime) > constants_1.INTERNAL_REQUEST_ALLOWED_TIME_DIFF) {
        res.status(401).json({ message: "Unauthorized - Request Expired" });
        return;
    }
    if (internalSecret !== env_1.default.get("INTERNAL_SECRET")) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    next();
}
