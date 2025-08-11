import { BadgeOperator } from "#src/db/models/badge.model";

export default function calculateProgress(
  current: number,
  operator: BadgeOperator,
  target: number
) {
  switch (operator) {
    case BadgeOperator.EQ:
    case BadgeOperator.GTE:
      return Math.min(100, (current / target) * 100);
    case BadgeOperator.GT:
      return Math.min(100, (current / (target + 1)) * 100);
    case BadgeOperator.LTE:
    case BadgeOperator.LT:
      // For "less than" style, progress is weird — treat as reverse target
      return current < target ? 100 : 0;
    default:
      return 0;
  }
}