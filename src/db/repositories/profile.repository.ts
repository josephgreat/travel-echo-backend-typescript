import mongoose from "mongoose";
import { Profile, ProfileModel } from "../models/profile.model";
import { Repository } from "./repository";
import { castToObjectId } from "#src/utils/helpers";

export class ProfileRepository extends Repository<Profile> {
  constructor() {
    super(ProfileModel);
  }

  async findByProfileOrUserId(profileOrUserId: string | mongoose.Types.ObjectId) {
    const id = castToObjectId(profileOrUserId);
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

export const profileRepository = new ProfileRepository();
