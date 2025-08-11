import { BadgeOperator } from "#src/db/models/badge.model";

export default function checkEligibility(
  userValue: number,
  operator: BadgeOperator,
  requiredValue: number
): boolean {
  switch (operator) {
    case BadgeOperator.EQ:
      return userValue === requiredValue;
    case BadgeOperator.GT:
      return userValue > requiredValue;
    case BadgeOperator.GTE:
      return userValue >= requiredValue;
    case BadgeOperator.LT:
      return userValue < requiredValue;
    case BadgeOperator.LTE:
      return userValue <= requiredValue;
    default:
      return false;
  }
}
