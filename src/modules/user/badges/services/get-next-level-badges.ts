import { Badge, BadgeCategory } from "#src/db/models/badge.model";
import { badgeRepository } from "#src/db/repositories/badge.repository";
import { earnedBadgeRepository } from "#src/db/repositories/earned-badge.repository";
import { milestoneRepository } from "#src/db/repositories/milestone.repository";
import { castToObjectId } from "#src/utils/helpers";
import { Types } from "mongoose";
import calculateProgress from "./calculate-progress";
import badgeMilestoneMap from "./badge-milestone-map";

export async function getNextLevelBadgesWithProgress(userId: string | Types.ObjectId) {
  const userObjectId = castToObjectId(userId);

  // 1. Get user's milestone
  const milestone = await milestoneRepository.findOrCreate(
    { user: userObjectId },
    { user: userObjectId }
  );

  // 2. Get earned badges
  const earnedBadges = await earnedBadgeRepository.findMany({ user: userObjectId });
  const earnedBadgeIds = earnedBadges.map((b) => b.badge.toString());

  const results: {
    _id: string;
    category: BadgeCategory;
    nextBadge: Badge | null;
    percentageProgress: number; // 0 - 100
  }[] = [];

  // 3. Loop categories
  for (const category of [BadgeCategory.Trip, BadgeCategory.Memory]) {
    const currentValue = milestone[badgeMilestoneMap[category]]

    // 4. Get badges in category sorted by level
    const badges = await badgeRepository.findMany({ category }, { sort: { level: 1 } });

    // 5. Find user's highest-earned badge in this category
    let highestEarnedIndex = -1;
    for (let i = 0; i < badges.length; i++) {
      if (earnedBadgeIds.includes(badges[i]._id.toString())) {
        highestEarnedIndex = i;
      }
    }

    // 6. Next badge is the one right after highest earned
    const nextBadge = badges[highestEarnedIndex + 1] || null;

    // 7. Calculate progress toward next badge
    let progress = 0;
    if (nextBadge) {
      progress = calculateProgress(currentValue, nextBadge.operator, nextBadge.value);
    }

    results.push({
      "_id": `${Date.now}`,
      category,
      nextBadge,
      percentageProgress: progress
    });
  }

  return results;
}
