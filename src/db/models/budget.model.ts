import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { Trip } from "./trip.model";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Budget {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ ref: () => Trip })
  public trip?: mongoose.Types.ObjectId;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public plannedAmount!: number;

  @prop({ required: true, default: 0 })
  public spentAmount!: number;

  @prop()
  public currency?: string;

  @prop()
  public notes?: string;
}

export const BudgetModel = getModelForClass(Budget);
