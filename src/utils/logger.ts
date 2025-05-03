import path from "path";
import fs from "fs";
import winston from "winston";
import "winston-daily-rotate-file";

class Logger {
  private static instance: Logger;
  private logger: winston.Logger;
  private logsDir = path.resolve("logs");
  private customColors: { [key: string]: string } = {
    error: "red",
    warn: "yellow",
    info: "blue",
    debug: "green"
  };

  private constructor() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    winston.addColors(this.customColors);

    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.printf(({ timestamp, level, message }) => {
              return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            }),
            winston.format.colorize({ all: true })
          )
        }),

        process.env.NODE_ENV === "production" &&
          new winston.transports.DailyRotateFile({
            filename: path.join(this.logsDir, "site-%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: 20 * 1024 * 1024,
            maxFiles: 14,
            level: "info"
          })
      ].filter(Boolean) as winston.transport[]
    });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public info(message: string): void {
    this.logger.info(message);
  }

  public error(message: string, error?: Error): void {
    if (error) {
      this.logger.error(`${message}\nError: ${error.message}\nStack Trace: ${error.stack}`);
    } else {
      this.logger.error(message);
    }
  }

  public warn(message: string): void {
    this.logger.warn(message);
  }

  public debug(message: string): void {
    this.logger.debug(message);
  }
}

const logger = Logger.getInstance();

export default logger;
