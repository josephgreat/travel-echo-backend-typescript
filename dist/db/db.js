"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const env_1 = __importDefault(require("#src/utils/env"));
const logger_1 = __importDefault(require("#src/utils/logger"));
const mongoose_1 = require("mongoose");
//import { MilestoneModel } from "./models/milestone.model";
const initializeDatabase = () => {
    (0, mongoose_1.connect)(env_1.default.get("MONGODB_URI"))
        .then(async () => {
        logger_1.default.info("MongoDB connection established");
        /* const milestones = await MilestoneModel.find();
        for (const ms of milestones) {
          const data = {
            totalBudgets: ms.totalBudgets || 0,
            totalMemories: ms.totalMemories || 0,
            totalPosts: ms.totalPosts || 0,
            totalTrips: ms.totalTrips || 0
          };
          await ms.updateOne(data);
        } */
    })
        .catch((error) => {
        logger_1.default.error(`MongoDB Connection Error`, error);
    });
};
exports.initializeDatabase = initializeDatabase;
