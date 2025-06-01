import type { NextFunction, Request, Response } from "express";

export interface ParsedQuery {
  sort?: Record<string, 1 | -1>;
  select?: string[];
  populate?: { path: string; select?: string[] }[];
  where?: Record<string, unknown>;
  limit?: number;
  skip?: number;
}
export default function parseRequestQuery(req: Request, res: Response, next: NextFunction) {
  const { where, sort, select, populate, limit, skip } = req.query;

  const parsedQuery: ParsedQuery = {};

  if (where) {
    const filters: ParsedQuery["where"] = {};
    const conditions = Array.isArray(where) ? where : [where];

    conditions.forEach((condition) => {
      const [key, value] = condition.toString().split(",");
      if (key && value !== undefined) {
        const trimmedValue = value.trim();
        if (trimmedValue === "false" || trimmedValue === "true") {
          filters[key] = Boolean(trimmedValue);
        } else if (trimmedValue.startsWith("<") || trimmedValue.startsWith(">")) {
          const [sign, ...numbers] = trimmedValue.split("");
          filters[key] = {
            [sign === "<" ? "$lt" : "$gt"]: Number(numbers.join(""))
          };
        } else if (isNaN(Number(trimmedValue))) {
          filters[key] = trimmedValue;
        } else {
          filters[key] = trimmedValue;
        }
      }
    });
    parsedQuery.where = filters;
  }

  if (sort) {
    /**
     * /api/users?sort=name,desc&sort=age,asc
     */
    const sortObj: Record<string, 1 | -1> = {};
    const sortParams = Array.isArray(sort) ? sort : [sort];

    sortParams.forEach((sortItem) => {
      const parts = sortItem.toString().split(",");
      const field = parts[0]?.trim();
      const order = parts[1]?.trim();
      if (field && order) {
        sortObj[field] = order.toUpperCase() === "DESC" ? -1 : 1;
      }
    });
    parsedQuery.sort = sortObj;
  }

  if (select) {
    /**
     * /api/users?select=name,email,age
     */
    const selectParams = Array.isArray(select) ? select.join(",") : select.toString();
    parsedQuery.select = selectParams.split(",");
  }

  if (populate) {
    /**
     * /api/users?populate=profile
     * /api/users?populate=profile,id,image
     * /api/users?populate=profile&populate=subscription
     */
    const populateParams = Array.isArray(populate) ? populate : [populate];

    parsedQuery.populate = populateParams.map((popItem) => {
      const [path, ...fields] = popItem.toString().split(",");
      return fields.length ? { path, select: fields } : { path };
    });
  }

  if (limit) {
    /**
     * /api/users?limit=100
     */
    const parsedLimit = Array.isArray(limit) ? limit[0].toString() : limit.toString();
    parsedQuery.limit = parseInt(parsedLimit, 10) || 0;
  }

  if (skip) {
    /**
     * /api/users?skip=50
     */
    const parsedSkip = Array.isArray(skip) ? skip[0].toString() : skip.toString();
    parsedQuery.skip = parseInt(parsedSkip, 10) || 0;
  }

  req.parsedQuery = parsedQuery;

  next();
}
