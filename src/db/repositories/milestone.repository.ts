import { Milestone, MilestoneModel } from "../models/milestone.model";
import { Repository } from "./repository";

export class MilestoneRepository extends Repository<Milestone> {
  constructor() {
    super(MilestoneModel);
  }
}

export const milestoneRepository = new MilestoneRepository();
