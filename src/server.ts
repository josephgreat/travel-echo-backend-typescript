import http from "node:http";
import app from "./app";
import env from "#src/utils/env";
import logger from "#src/utils/logger";

const PORT = env.get("PORT", 8000);
const BASE_URL = env.get("BASE_URL");

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(
    `Server is running on ${env.get("NODE_ENV") !== "production" ? BASE_URL : `port ${PORT}`}`
  );
});

server.on("error", (error) => {
  logger.error("Server error", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});
