import env from "#src/utils/env";
import logger from "#src/utils/logger";
import { connect } from "mongoose";
//import { MilestoneModel } from "./models/milestone.model";

export const initializeDatabase = () => {
  connect(env.get("MONGODB_URI"))
    .then(async () => {
      logger.info("MongoDB connection established");
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
      logger.error(`MongoDB Connection Error`, error);
    });
};
