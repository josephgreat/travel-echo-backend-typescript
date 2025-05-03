import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { BillingCycle } from "./plan.model";
import { User } from "./user.model";

export enum PaymentStatus {
  Success = "SUCCESS",
  Failed = "FAILED",
  Abandoned = "ABANDONED"
}

export enum PaymentChannel {
  Card = "CARD",
  Bank = "BANK",
  Ussd = "USSD"
}

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Payment {
  @prop({ ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public reference!: string;

  @prop({ required: true })
  public amount!: number;

  @prop({ default: "NGN" })
  public currency!: string;

  @prop({ enum: PaymentStatus, required: true })
  public status!: PaymentStatus;

  @prop({ enum: PaymentChannel })
  public channel?: PaymentChannel;

  @prop()
  public gateway_response?: string;

  @prop({ enum: BillingCycle })
  public planType?: BillingCycle;

  @prop()
  public paidAt?: Date;
}

export const PaymentModel = getModelForClass(Payment);
