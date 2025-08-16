import { Badge, BadgeCategory, BadgeModel } from "#src/db/models/badge.model";
import { milestoneRepository } from "#src/db/repositories/milestone.repository";
import { castToObjectId } from "#src/utils/helpers";
import { Types } from "mongoose";
import calculateProgress from "./calculate-progress";
import badgeMilestoneMap from "./badge-milestone-map";
import {
  EarnedBadge,
  EarnedBadgeModel
} from "#src/db/models/earned-badge.model";

type PopulatedEarnedBadge = EarnedBadge & { badge: Badge };

export async function getNextLevelBadgesWithProgress(
  userId: string | Types.ObjectId
) {
  const userObjectId = castToObjectId(userId);

  // 1. Get user's milestone
  const milestone = await milestoneRepository.findOrCreate(
    { user: userObjectId },
    { user: userObjectId }
  );

  // 2. Get earned badges
  const earnedBadges = (await EarnedBadgeModel.find({
    user: userObjectId
  })
    .sort({ level: 1 })
    .populate("badge")) as unknown as PopulatedEarnedBadge[];

  const groupedBadges = earnedBadges.reduce(
    (acc, earnedBadge) => {
      const badge = earnedBadge.badge as unknown as Badge;
      acc[badge.category] = acc[badge.category] ?? [];
      acc[badge.category].push(earnedBadge);
      return acc;
    },
    {} as Record<BadgeCategory, PopulatedEarnedBadge[]>
  );

  const categories: BadgeCategory[] = [
    BadgeCategory.Budget,
    BadgeCategory.Memory,
    BadgeCategory.Trip
  ];

  const results: Partial<
    Record<
      BadgeCategory,
      {
        highestEarnedBadge: Badge | null;
        nextLevelBadge: Badge;
        currentValue: number;
        requiredValue: number;
        percentageProgress: number;
      }
    >
  > = {};

  for (const category of categories) {
    let nextBadge: Badge | null = null;
    const highestLevelEarnedBadge = groupedBadges[category]?.at(-1);
    if (!highestLevelEarnedBadge) {
      nextBadge = await BadgeModel.findOne({ category, level: 1 });
    } else {
      nextBadge = await BadgeModel.findOne({
        category,
        level: highestLevelEarnedBadge.badge.level + 1
      });
    }

    if (!nextBadge) {
      continue;
    }

    const currentValue = milestone[badgeMilestoneMap[category]];
    const requiredValue = nextBadge?.value ?? 0;
    const percentageProgress = calculateProgress(
      currentValue,
      nextBadge?.operator,
      requiredValue
    );

    results[category] = {
      highestEarnedBadge: highestLevelEarnedBadge?.badge ?? null,
      nextLevelBadge: nextBadge,
      currentValue,
      requiredValue,
      percentageProgress
    };
  }

  return results;
}
