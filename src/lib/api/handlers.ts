import type { Request, Response, NextFunction, RequestHandler } from "express";
import { HttpException, HttpResponse } from "./http";
import { z, ZodError } from "zod";

export type DefineHandlerFunction = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => void | Promise<void> | T | Promise<T>
) => RequestHandler;
/**
 * A higher-order function that wraps an asynchronous handler function with error handling and response formatting.
 *
 * This function ensures that:
 * - If the result is an `HttpException`, it will be thrown and handled by the global error handler.
 * - If the result is a primitive (string, number, boolean), it will be sent directly.
 * - If the result is an instance of `HttpResponse`, it will be sent using `send()`.
 * - If the result is a JSON-serializable object, it will be returned as a JSON response.
 *
 * @param fn - The asynchronous handler function to be wrapped.
 * @returns An Express middleware function that wraps the handler.
 */

export const defineHandler: DefineHandlerFunction = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => T | Promise<T>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn(req, res, next);

      if (res.headersSent) return;

      if (result instanceof HttpException) {
        next(result);
        return;
      }

      if (result === undefined || result === null) {
        res.status(204).send();
      } else if (
        typeof result === "string" ||
        typeof result === "number" ||
        typeof result === "boolean"
      ) {
        res.status(200).send(result);
      } else if (result instanceof HttpResponse) {
        result.send(res);
      } else {
        try {
          res.status(200).json({ success: true, statusCode: res.status, ...result });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          res.status(200).send(String(result));
        }
      }
    } catch (error) {
      next(error);
    }
  };
};

type RequestPart = "body" | "query" | "params" | "headers";

export type DefineValidatorOptions<T extends z.ZodTypeAny> = {
  errorCode?: string;
  errorMessage?: string;
  onSuccess?: (parsed: z.infer<T>, req: Request, res: Response, next: NextFunction) => void;
  onError?: (error: z.ZodError, req: Request, res: Response, next: NextFunction) => void;
};

export type DefineValidatorFunction = typeof defineValidator;
/**
 * Defines a validation middleware that parses and attaches the validated data to the request object.
 *
 * @param path - Which part of the request to validate (body, query, params, headers)
 * @param schema - The Zod schema to use for validation
 * @param options - Optional custom error handling
 * @returns Express middleware
 */
export const defineValidator = <T extends RequestPart, K extends z.ZodTypeAny>(
  path: T,
  schema: K,
  options: DefineValidatorOptions<K> = {}
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[path];
    const result = schema.safeParse(data) as {
      success: boolean;
      data?: z.infer<K>;
      error?: z.ZodError;
    };

    if (result.success) {
      const parsed = result.data;

      switch (path) {
        case "body":
          req.validatedBody = parsed;
          break;
        case "query":
          req.validatedQuery = parsed;
          break;
        case "params":
          req.validatedParams = parsed;
          break;
        case "headers":
          req.validatedHeaders = parsed;
          break;
      }

      if (options.onSuccess) {
        return options.onSuccess(parsed, req, res, next);
      }
      return next();
    }

    const validationError = result.error as ZodError;

    if (options.onError) {
      return options.onError(validationError, req, res, next);
    }

    const errorMessage = options.errorMessage || validationError.errors[0].message;

    const error = new HttpException(400, errorMessage, {
      errorCode: options.errorCode || `VALIDATION_ERROR_${path.toUpperCase()}`,
      data: {
        errors: validationError.errors
      }
    });

    next(error);
  };
};
