import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { Trip } from "./trip.model";
import { Budget } from "./budget.model";
import { CloudinaryImage } from "./models";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Expense {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ ref: () => Trip })
  public trip?: mongoose.Types.ObjectId;

  @prop({ required: true, ref: () => Budget })
  public budget!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public category!: string;

  @prop()
  public plannedAmount?: number;

  @prop({ required: true })
  public actualAmount!: number;

  @prop()
  public notes?: string;

  @prop()
  public receipt?: CloudinaryImage;
}

export const ExpenseModel = getModelForClass(Expense);
