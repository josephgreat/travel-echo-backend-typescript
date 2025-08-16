import {
  BadgeModel,
  BadgeZodSchema,
  BadgeZodType
} from "#src/db/models/badge.model";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";

export const getBadges = defineApi(
  {
    path: "/badges"
  },
  defineHandler(async () => {
    const badges = await BadgeModel.find().lean();
    return {
      badges
    };
  })
);

export const createBadge = defineApi(
  {
    path: "/badges",
    method: "post",
    middleware: defineValidator("body", BadgeZodSchema)
  },
  defineHandler(async (req) => {
    const body = req.validatedBody as BadgeZodType;

    const existingBadge = await BadgeModel.findOne({
      level: body.level,
      category: body.category
    }).lean();
    if (existingBadge) {
      throw HttpException.badRequest(
        "Another badge with the same category and level already exists"
      );
    }
    const created = await BadgeModel.create(body);

    return {
      badge: created
    };
  })
);
