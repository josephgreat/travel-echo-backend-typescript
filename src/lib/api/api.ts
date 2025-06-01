import internalOnly from "#src/middleware/internal-only";
import { RequestHandler, NextFunction, Request, Response } from "express";

export type ApiRequestHandler =
  | RequestHandler
  | ((req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>);

export interface ApiOptions {
  method?: "get" | "post" | "put" | "patch" | "delete" | "head";
  path: string;
  group?: string;
  expose?: boolean;
  middleware?: ApiRequestHandler | ApiRequestHandler[];
}

export interface ApiDefinition {
  options: Omit<ApiOptions, "middleware">;
  handlers: ApiRequestHandler[];
}

export const api = (options: ApiOptions, ...handlers: ApiRequestHandler[]) => {
  let { path = "" } = options;
  const { expose = true, method = "get", group = "", middleware = [] } = options;

  if (!path && !group) throw new Error("Path or group is required");
  if (path.trim() === "/") path = "";

  const allMiddleware = Array.isArray(middleware) ? middleware : [middleware];
  const allHandlers: ApiRequestHandler[] = [];

  if (allMiddleware.length) allHandlers.push(...allMiddleware);
  allHandlers.push(...handlers);

  if (!expose) {
    allHandlers.unshift(internalOnly);
  }

  const apiDefinition: ApiDefinition = {
    options: { path, expose, method, group },
    handlers: allHandlers
  };

  return apiDefinition;
};
