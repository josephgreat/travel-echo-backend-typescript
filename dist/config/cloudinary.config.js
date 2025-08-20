"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = __importDefault(require("cloudinary"));
const env_1 = __importDefault(require("#src/utils/env"));
const logger_1 = __importDefault(require("#src/utils/logger"));
const initializeCloudinary = () => {
    const configOptions = cloudinary_1.default.v2.config({
        cloud_name: env_1.default.get("CLOUDINARY_CLOUD_NAME"),
        api_key: env_1.default.get("CLOUDINARY_API_KEY"),
        api_secret: env_1.default.get("CLOUDINARY_API_SECRET"),
        secure: true
    });
    logger_1.default.info("Cloudinary initialized");
    return configOptions;
};
exports.default = initializeCloudinary;
