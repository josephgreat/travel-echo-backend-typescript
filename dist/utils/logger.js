"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const winston_1 = __importDefault(require("winston"));
require("winston-daily-rotate-file");
class Logger {
    constructor() {
        this.logsDir = path_1.default.resolve("logs");
        this.customColors = {
            error: "red",
            warn: "yellow",
            info: "blue",
            debug: "green"
        };
        if (!fs_1.default.existsSync(this.logsDir)) {
            fs_1.default.mkdirSync(this.logsDir, { recursive: true });
        }
        winston_1.default.addColors(this.customColors);
        this.logger = winston_1.default.createLogger({
            level: "info",
            format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })),
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.printf(({ timestamp, level, message }) => {
                        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
                    }), winston_1.default.format.colorize({ all: true }))
                }),
                process.env.NODE_ENV === "production" &&
                    new winston_1.default.transports.DailyRotateFile({
                        filename: path_1.default.join(this.logsDir, "site-%DATE%.log"),
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: true,
                        maxSize: 20 * 1024 * 1024,
                        maxFiles: 14,
                        level: "info"
                    })
            ].filter(Boolean)
        });
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    info(message) {
        this.logger.info(message);
    }
    error(message, error) {
        if (error) {
            this.logger.error(`${message}\nError: ${error.message}\nStack Trace: ${error.stack}`);
        }
        else {
            this.logger.error(message);
        }
    }
    warn(message) {
        this.logger.warn(message);
    }
    debug(message) {
        this.logger.debug(message);
    }
}
const logger = Logger.getInstance();
exports.default = logger;
