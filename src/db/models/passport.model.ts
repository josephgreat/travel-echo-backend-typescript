import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { CloudinaryImage } from "./models";
import { z } from "zod";
import { MIN_PASSPORT_NUMBER_LENGTH } from "#src/utils/constants";

export enum PassportType {
  Regular = "REGULAR",
  Official = "OFFICIAL",
  Diplomatic = "DIPLOMATIC",
  Service = "SERVICE",
  Emergency = "EMERGENCY"
}

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Passport {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public passportNumber!: string;

  @prop({ enum: PassportType, required: true })
  public passportType!: PassportType;

  @prop({ required: true })
  public fullName!: string;

  @prop({ required: true })
  public nationality!: string;

  @prop({ required: true })
  public issueDate!: Date;

  @prop({ required: true })
  public expiryDate!: Date;

  @prop()
  public image?: CloudinaryImage;

  @prop()
  public placeOfIssue?: string;
}

export const PassportModel = getModelForClass(Passport);

export const PassportZodSchema = z.object(
  {
    user: z
      .string({ message: "User ID is required" })
      .refine((value) => mongoose.isValidObjectId(value), {
        message: "Invalid user ID"
      })
      .transform((value) => new mongoose.Types.ObjectId(value)),
    passportNumber: z
      .string({ message: "Passport number is required" })
      .min(MIN_PASSPORT_NUMBER_LENGTH, { message: "Passport number is too short" }),
    passportType: z.enum(
      [
        PassportType.Regular,
        PassportType.Official,
        PassportType.Diplomatic,
        PassportType.Service,
        PassportType.Emergency
      ],
      { message: "Passport type is required" }
    ),
    fullName: z.string({ message: "Full name is required" }),
    nationality: z.string({ message: "Nationality is required" }),
    issueDate: z.coerce.date({ message: "Issue date is not a valid date" }),
    expiryDate: z.coerce.date({ message: "Expiry date is not a valid date" }),
    placeOfIssue: z
      .string({ message: "Place of issue is required" })
      .nullish()
      .transform((val) => val || undefined)
  },
  {
    message: "No passport data provided"
  }
);

export type PassportZodType = z.infer<typeof PassportZodSchema>;
