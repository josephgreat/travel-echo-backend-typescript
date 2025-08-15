import { BadgeCategory } from "#src/db/models/badge.model";

type MilestoneNumberKeys = "totalTrips" | "totalMemories" | "totalBudgets";

const badgeMilestoneMap: Record<BadgeCategory, MilestoneNumberKeys> = {
  TRIP: "totalTrips",
  MEMORY: "totalMemories",
  BUDGET: "totalBudgets"
};

export default badgeMilestoneMap;
