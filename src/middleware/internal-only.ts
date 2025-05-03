import env from "#src/utils/env";
import { Request, Response, NextFunction } from "express";
import { INTERNAL_REQUEST_ALLOWED_TIME_DIFF } from "./../utils/constants";

export default function internalOnly(req: Request, res: Response, next: NextFunction) {
  const internalSecret = req.get("X-Internal-Secret");
  const timestamp = req.get("X-Timestamp");

  const now = Date.now();
  const requestTime = Number(timestamp);

  if (isNaN(requestTime) || Math.abs(now - requestTime) > INTERNAL_REQUEST_ALLOWED_TIME_DIFF) {
    res.status(401).json({ message: "Unauthorized - Request Expired" });
    return;
  }

  if (internalSecret !== env.get("INTERNAL_SECRET")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
}
