import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";

export enum SubscriptionType {
  Monthly = "MONTHLY",
  Yearly = "YEARLY"
}

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Subscription {
  @prop({ required: true, ref: "User" })
  public user!: mongoose.Types.ObjectId;

  @prop()
  public isActive!: boolean;

  @prop({ enum: SubscriptionType })
  public planType!: SubscriptionType;

  @prop()
  public paystackSubscriptionCode!: string;

  @prop()
  public startDate!: Date;

  @prop()
  public expireDate!: Date;
}

export const SubscriptionModel = getModelForClass(Subscription);
