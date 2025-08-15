import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Milestone {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ default: 0 })
  public totalTrips!: number;

  @prop({ default: 0 })
  public totalMemories!: number;

  @prop({ default: 0 })
  public totalBudgets!: number;
}

export const MilestoneModel = getModelForClass(Milestone);
