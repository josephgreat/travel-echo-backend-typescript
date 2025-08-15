import { Badge, BadgeCategory } from "#src/db/models/badge.model";
import { badgeRepository } from "#src/db/repositories/badge.repository";
import { earnedBadgeRepository } from "#src/db/repositories/earned-badge.repository";
import { milestoneRepository } from "#src/db/repositories/milestone.repository";
import { castToObjectId } from "#src/utils/helpers";
import { Types } from "mongoose";
import checkEligibility from "./check-eligibility";
import badgeMilestoneMap from "./badge-milestone-map";

export async function getNextEligibleBadge(
  userId: string | Types.ObjectId,
  category: BadgeCategory
) {
  const userObjectId = castToObjectId(userId);

  // 1. Get user's milestone
  const milestone = await milestoneRepository.findOrCreate(
    { user: userObjectId },
    { user: userObjectId }
  );

  const currentValue = milestone[badgeMilestoneMap[category]];

  // 2. Get earned badge IDs
  const earnedBadges = await earnedBadgeRepository.findMany({ user: userObjectId });
  const earnedBadgeIds = earnedBadges.map((b) => b.badge.toString());

  // 3. Get badges in category, sorted by level
  const badges = await badgeRepository.findMany({ category }, { sort: { level: 1 } });

  // 4. Filter out already earned & check eligibility
  for (const badge of badges) {
    if (earnedBadgeIds.includes(badge._id.toString())) continue;

    const eligible = checkEligibility(currentValue, badge.operator, badge.value);
    if (eligible) return badge;
  }

  return null;
}

export async function getNextEligibleBadges(userId: string | Types.ObjectId) {
  const userObjectId = new Types.ObjectId(userId);

  // 1. Get user's milestone
  const milestone = await milestoneRepository.findOrCreate(
    { user: userObjectId },
    { user: userObjectId }
  );

  // 2. Get earned badges
  const earnedBadges = await earnedBadgeRepository.findMany({ user: userObjectId });
  const earnedBadgeIds = earnedBadges.map((b) => b.badge.toString());

  // 3. Prepare result object
  const results: Partial<Record<BadgeCategory, Badge | null>> = {};

  // 4. Loop through both categories
  for (const category of [BadgeCategory.Trip, BadgeCategory.Memory]) {
    const currentValue = milestone[badgeMilestoneMap[category]];

    const badges = await badgeRepository.findMany({ category }, { sort: { level: 1 } });

    for (const badge of badges) {
      if (earnedBadgeIds.includes(badge._id.toString())) continue;

      if (checkEligibility(currentValue, badge.operator, badge.value)) {
        results[category] = badge;
        break;
      }
    }
  }

  return results;
}
