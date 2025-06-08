import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { Trip } from "./trip.model";
import { z } from "zod";

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

export const BudgetZodSchema = z.object(
  {
    trip: z
      .string({ message: "Invalid Trip ID" })
      .refine((val) => val === undefined || mongoose.isObjectIdOrHexString(val), {
        message: "Invalid Trip ID"
      })
      .nullish()
      .transform((val) => (val ? new mongoose.Types.ObjectId(val) : undefined)),
    name: z.string({ message: "Budget name is required" }),
    plannedAmount: z
      .number({ message: "Planned amount is required" })
      .min(0, { message: "Planned amount cannot be negative" }),
    spentAmount: z
      .number({ message: "Invalid spent amount" })
      .min(0, { message: "Spent amount cannot be negative" })
      .nullish()
      .transform((val) => (val !== null ? val : undefined)),
    currency: z
      .string({ message: "Invalid currency" })
      .nullish()
      .transform((val) => val || undefined),
    notes: z
      .string({ message: "Invalid notes" })
      .nullish()
      .transform((val) => val || undefined)
  },
  {
    message: "No budget data provided"
  }
);

export type BudgetZodType = z.infer<typeof BudgetZodSchema>;
