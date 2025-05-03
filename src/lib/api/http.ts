import type { Response } from "express";

export class HttpResponse {
  public statusCode: number;
  public message: string;
  public data?: Record<string, unknown>;
  public success: boolean;

  constructor(statusCode: number, message: string, data?: Record<string, unknown>) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode >= 200 && statusCode < 300;
  }

  // Method to send the response
  send(res: Response): void {
    res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      ...(this.data && { data: this.data })
    });
  }

  // Static methods to create common responses
  static success(message: string = "Success", data?: Record<string, unknown>) {
    return new HttpResponse(200, message, data);
  }

  static created(message: string = "Created", data?: Record<string, unknown>) {
    return new HttpResponse(201, message, data);
  }

  static badRequest(message: string = "Bad Request", data?: Record<string, unknown>) {
    return new HttpResponse(400, message, data);
  }

  static unauthorized(message: string = "Unauthorized", data?: Record<string, unknown>) {
    return new HttpResponse(401, message, data);
  }

  static forbidden(message: string = "Forbidden", data?: Record<string, unknown>) {
    return new HttpResponse(403, message, data);
  }

  static notFound(message: string = "Not Found", data?: Record<string, unknown>) {
    return new HttpResponse(404, message, data);
  }

  static internal(message: string = "Internal Server Error", data?: Record<string, unknown>) {
    return new HttpResponse(500, message, data);
  }
}

export class HttpException extends Error {
  public statusCode: number;
  public message: string;
  public data?: Record<string, unknown>;
  public errorCode?: string;

  constructor(
    statusCode: number,
    message: string,
    options: {
      data?: Record<string, unknown>;
      errorCode?: string;
    } = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = options.data;
    this.errorCode = options.errorCode;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpException);
    }
  }

  static badRequest(message: string, data?: Record<string, unknown>) {
    return new HttpException(400, message, { data, errorCode: "BAD_REQUEST" });
  }

  static unauthorized(message = "Unauthorized") {
    return new HttpException(401, message, { errorCode: "UNAUTHORIZED" });
  }

  static forbidden(message = "Forbidden") {
    return new HttpException(403, message, { errorCode: "FORBIDDEN" });
  }

  static notFound(message = "Resource not found") {
    return new HttpException(404, message, { errorCode: "NOT_FOUND" });
  }

  static conflict(message = "Conflict occurred") {
    return new HttpException(409, message, { errorCode: "CONFLICT" });
  }

  static internal(message = "Internal server error", data?: Record<string, unknown>) {
    return new HttpException(500, message, {
      data,
      errorCode: "INTERNAL_SERVER_ERROR"
    });
  }

  toJSON() {
    return {
      success: false,
      statusCode: this.statusCode,
      message: this.message,
      ...(this.errorCode && { errorCode: this.errorCode }),
      ...(this.data && { data: this.data }),
      ...(process.env.NODE_ENV === "development" && { stack: this.stack })
    };
  }
}
