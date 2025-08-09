import { Badge, BadgeModel } from "../models/badge.model";
import { Repository } from "./repository";

export class BadgeRepository extends Repository<Badge> {
  constructor() {
    super(BadgeModel);
  }

}

export const badgeRepository = new BadgeRepository();
