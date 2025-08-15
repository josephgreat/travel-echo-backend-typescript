import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";
import { z } from "zod";

export enum BadgeOperator {
  EQ = "EQ",
  GT = "GT",
  GTE = "GTE",
  LT = "LT",
  LTE = "LTE"
}

export enum BadgeCategory {
  Trip = "TRIP",
  Memory = "MEMORY",
  Budget = "BUDGET"
}

@modelOptions({ schemaOptions: { timestamps: true } })
@index({ level: 1, category: 1 }, { unique: true })
export class Badge {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public description!: string;

  @prop({ required: true, unique: true })
  public level!: number;

  @prop({ required: true, enum: BadgeCategory })
  public category!: BadgeCategory;

  @prop({ required: true, enum: BadgeOperator })
  public operator!: BadgeOperator;

  @prop({ required: true })
  public value!: number;

  @prop()
  iconUrl?: string;
}

export const BadgeModel = getModelForClass(Badge);

export const BadgeZodSchema = z.object({
  name: z
    .string({ message: "Badge name is required" })
    .nonempty({ message: "Badge name is required" }),
  description: z
    .string({ message: "Badge description is required" })
    .nonempty({ message: "Badge description is required" }),
  level: z
    .number({ message: "Badge level must be a number" })
    .min(1, { message: "Badge level must be greater than 0" }),
  category: z.enum([BadgeCategory.Memory, BadgeCategory.Trip], {
    message: `Badge category must be ${BadgeCategory.Memory} or ${BadgeCategory.Trip}`
  }),
  operator: z.enum(["EQ", "GT", "GTE", "LT", "LTE"], {
    message: `Badge operator must be EQ, GT, GTE, LT, or LTE`
  }),
  value: z
    .number({ message: "Value must be a number" })
    .nonnegative({ message: "Value cannot be negative" }),
  iconUrl: z.string({ message: "Invalid icon URL" }).optional()
});

export type BadgeZodType = z.infer<typeof BadgeZodSchema>;
