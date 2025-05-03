import cloudinary from "cloudinary";
import env from "#src/utils/env";
import logger from "#src/utils/logger";

const initializeCloudinary = () => {
  const configOptions = cloudinary.v2.config({
    cloud_name: env.get("CLOUDINARY_CLOUD_NAME"),
    api_key: env.get("CLOUDINARY_API_KEY"),
    api_secret: env.get("CLOUDINARY_API_SECRET"),
    secure: true
  });
  logger.info("Cloudinary initialized");
  return configOptions;
};

export default initializeCloudinary;
