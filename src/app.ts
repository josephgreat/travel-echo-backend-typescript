import express from "express";
import errorHandler from "#src/middleware/error-handler";
import corsConfig from "#src/config/cors.config";
import initializeCloudinary from "#src/config/cloudinary.config";
import path from "node:path";
import { generateRoutes } from "./lib/api/route-gen";
import { initializeDatabase } from "./db/db";
import parseRequestQuery from "./middleware/parse-request-query";
import { routeConfig } from "./config/routes.config";
import logger from "./middleware/logger";

initializeDatabase();
initializeCloudinary();

export const app = express();

async function main() {
  //Middleware
  app.use(corsConfig);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.resolve("public")));
  app.use(logger);

  /**
   * API Documentation
   */
  app.get("/doc", (req, res) => {
    const filePath = path.resolve("public/html/api.html");
    res.sendFile(filePath);
  });

  app.get("/upload", (req, res) => {
    res.sendFile(path.resolve("public/html/upload.html"));
  });

  app.get("/badges", (req, res) => {
    res.sendFile(path.resolve("public/html/badges/index.html"));
  });

  app.use(parseRequestQuery);
  await generateRoutes(app, routeConfig);
  app.use(errorHandler);
}

main();
