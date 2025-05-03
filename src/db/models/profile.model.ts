import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose";
import { computeAge } from "#src/utils/helpers";
import { MINIMUM_USER_AGE } from "#src/utils/constants";
import mongoose from "mongoose";

export enum Gender {
  Male = "MALE",
  Female = "FEMALE",
  Other = "OTHER"
}

export class ProfileImage {
  @prop()
  public url!: string;

  @prop()
  public name!: string;

  @prop()
  public publicId!: string;

  @prop()
  public assetId!: string;

  @prop()
  public format!: string;

  @prop()
  public bytes!: number;
}

export class School {
  @prop()
  public name?: string;

  @prop()
  public country?: string;
}

@pre<Profile>("save", async function (next) {
  if (this.dateOfBirth && this.isModified("dateOfBirth")) {
    const age = computeAge(this.dateOfBirth);
    if (age < MINIMUM_USER_AGE) {
      return next(new Error(`You must be at least ${MINIMUM_USER_AGE} years old.`));
    }
  }
  next();
})
@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Profile {
  @prop({ required: true })
  public user!: mongoose.Types.ObjectId;

  @prop()
  public dateOfBirth?: Date;

  @prop({ enum: Gender })
  public gender?: Gender;

  @prop()
  public image?: ProfileImage;

  @prop()
  public location?: string;

  @prop()
  public school?: School;

  @prop()
  public occupation?: string;

  @prop({ type: () => [String] })
  public interests?: string[];

  @prop({ type: () => [String] })
  public languages?: string[];
}

export const ProfileModel = getModelForClass(Profile);
