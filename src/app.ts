import express, { type Express } from "express";
import errorHandler from "#src/middleware/error-handler";
import corsConfig from "#src/config/cors.config";
import initializeCloudinary from "#src/config/cloudinary.config";
import path from "node:path";
import { generateRoutes } from "./lib/api/route-gen";
import { initializeDatabase } from "./db/db";
import parseRequestQuery from "./middleware/parse-request-query";
import { routeConfig } from "./config/routes.config";

initializeDatabase();
initializeCloudinary();

const app: Express = express();

//Middleware
app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve("public")));
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});
/**
 * API Documentation
 */
app.get("/doc", (req, res) => {
  const filePath = path.resolve("public/api.html");
  res.sendFile(filePath);
});

app.get("/upload", (req, res) => {
  res.sendFile(path.resolve("public/upload.html"));
});

(async function () {
  app.use(parseRequestQuery);
  await generateRoutes(app, routeConfig);
  app.use(errorHandler);
})();

export default app;
