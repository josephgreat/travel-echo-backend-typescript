"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = __importDefault(require("#src/utils/env"));
const transporter = nodemailer_1.default.createTransport({
    host: env_1.default.get("EMAIL_HOST"),
    port: 465,
    secure: true,
    auth: {
        user: env_1.default.get("EMAIL_USER"),
        pass: env_1.default.get("EMAIL_PASSWORD")
    }
});
exports.default = transporter;
