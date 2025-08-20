"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.milestoneRepository = exports.MilestoneRepository = void 0;
const milestone_model_1 = require("../models/milestone.model");
const repository_1 = require("./repository");
class MilestoneRepository extends repository_1.Repository {
    constructor() {
        super(milestone_model_1.MilestoneModel);
    }
}
exports.MilestoneRepository = MilestoneRepository;
exports.milestoneRepository = new MilestoneRepository();
