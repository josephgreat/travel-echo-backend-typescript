import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Trip {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public name!: string;

  @prop()
  public description?: string;

  @prop({ type: () => [String] })
  public locations?: string[];

  @prop()
  public startDate?: Date;

  @prop()
  public endDate?: Date;
}

export const TripModel = getModelForClass(Trip);
