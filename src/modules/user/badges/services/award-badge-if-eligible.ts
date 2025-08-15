import { Badge, BadgeCategory } from "#src/db/models/badge.model";
import { badgeRepository } from "#src/db/repositories/badge.repository";
import { earnedBadgeRepository } from "#src/db/repositories/earned-badge.repository";
import { milestoneRepository } from "#src/db/repositories/milestone.repository";
import { castToObjectId } from "#src/utils/helpers";
import { Types } from "mongoose";
import checkEligibility from "./check-eligibility";
import badgeMilestoneMap from "./badge-milestone-map";

/**
 * Checks if a user has earned a new badge in a given category.
 * Awards the badge if eligible.
 */
export async function awardBadgeIfEligible(
  userId: string | Types.ObjectId,
  category: BadgeCategory
): Promise<{ hasEarnedNewBadge: boolean; badge: Badge | null }> {
  const userObjectId = castToObjectId(userId);

  // 1. Get milestone
  const milestone = await milestoneRepository.findOrCreate(
    { user: userObjectId },
    { user: userObjectId }
  );

  const currentValue = milestone[badgeMilestoneMap[category]];
  
  // 2. Get earned badges
  const earnedBadges = await earnedBadgeRepository.findMany({ user: userObjectId });
  const earnedBadgeIds = earnedBadges.map((b) => b.badge.toString());

  // 3. Get badges for the category, sorted by level
  const badges = await badgeRepository.findMany({ category }, { sort: { level: 1 } });

  // 4. Find the first eligible badge the user hasn’t earned yet
  for (const badge of badges) {
    if (earnedBadgeIds.includes(badge._id.toString())) continue;

    if (checkEligibility(currentValue, badge.operator, badge.value)) {
      // Award the badge
      await earnedBadgeRepository.create({
        user: userObjectId,
        badge: badge._id,
        earnedAt: new Date()
      });

      return { hasEarnedNewBadge: true, badge };
    }
  }

  // No new badge earned
  return { hasEarnedNewBadge: false, badge: null };
}
