import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose";
import { computeAge } from "#src/utils/helpers";
import { MIN_USER_AGE } from "#src/utils/constants";
import mongoose from "mongoose";
import { CloudinaryImage } from "./models";

export enum Gender {
  Male = "MALE",
  Female = "FEMALE",
  Other = "OTHER"
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
    if (age < MIN_USER_AGE) {
      return next(new Error(`You must be at least ${MIN_USER_AGE} years old.`));
    }
  }
  next();
})
@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Profile {
  @prop({ required: true, ref: "User" })
  public user!: mongoose.Types.ObjectId;

  @prop()
  public dateOfBirth?: Date;

  @prop({ enum: Gender })
  public gender?: Gender;

  @prop()
  public image?: CloudinaryImage;

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
