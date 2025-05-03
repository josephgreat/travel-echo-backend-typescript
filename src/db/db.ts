import env from "#src/utils/env";
import logger from "#src/utils/logger";
import { connect } from "mongoose";

export const initializeDatabase = () => {
  connect(env.get("MONGODB_URI"))
    .then(() => {
      logger.info("MongoDB connection established");
    })
    .catch((error) => {
      logger.error(`MongoDB Connection Error`, error);
    });
};
