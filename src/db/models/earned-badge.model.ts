import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { Badge } from "./badge.model";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class EarnedBadge {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: () => Badge })
  public badge!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public earnedAt!: Date;
}

export const EarnedBadgeModel = getModelForClass(EarnedBadge);
