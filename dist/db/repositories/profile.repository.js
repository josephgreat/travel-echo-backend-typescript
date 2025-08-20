"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRepository = exports.ProfileRepository = void 0;
const profile_model_1 = require("../models/profile.model");
const repository_1 = require("./repository");
const helpers_1 = require("#src/utils/helpers");
class ProfileRepository extends repository_1.Repository {
    constructor() {
        super(profile_model_1.ProfileModel);
    }
    async findByProfileOrUserId(profileOrUserId) {
        const id = (0, helpers_1.castToObjectId)(profileOrUserId);
        let profile = await this.model
            .findById(id)
            .populate({ path: "user", select: "-password -passwordHistory" })
            .lean();
        if (!profile) {
            profile = await this.model
                .findOne({ user: id })
                .populate({ path: "user", select: "-password -passwordHistory" })
                .lean();
        }
        return profile;
    }
}
exports.ProfileRepository = ProfileRepository;
exports.profileRepository = new ProfileRepository();
