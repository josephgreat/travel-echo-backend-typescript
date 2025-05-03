import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

export enum BillingCycle {
  Monthly = "MONTHLY",
  Yearly = "YEARLY"
}

export class BillingOptions {
  @prop({ enum: BillingCycle, required: true })
  billingCycle!: BillingCycle;

  @prop({ required: true })
  price!: number;

  @prop()
  paystackPlanCode!: string;
}

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Plan {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true, unique: true })
  public code!: string;

  @prop({ default: "NGN" })
  public currency!: string;

  @prop({ type: () => [String], required: true })
  public features!: string[];

  @prop({ type: () => [BillingOptions], required: true })
  public billingOptions!: BillingOptions[];
}

export const PlanModel = getModelForClass(Plan);
