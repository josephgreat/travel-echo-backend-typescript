import { EarnedBadge, EarnedBadgeModel } from "../models/earned-badge.model";
import { Repository } from "./repository";

export class EarnedBadgeRepository extends Repository<EarnedBadge> {
  constructor() {
    super(EarnedBadgeModel);
  }
}

export const earnedBadgeRepository = new EarnedBadgeRepository();
