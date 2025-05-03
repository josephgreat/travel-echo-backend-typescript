/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ParsedQuery } from "#src/middleware/parse-request-query";
import { Request } from "express";
import type { AuthUser } from "./user";

declare global {
  namespace Express {
    export interface User extends AuthUser {}

    export interface Request {
      validatedBody?: any;
      validatedQuery?: any;
      validatedParams?: any;
      validatedHeaders?: any;
      user?: User;
      parsedQuery?: ParsedQuery;
    }
  }
}
