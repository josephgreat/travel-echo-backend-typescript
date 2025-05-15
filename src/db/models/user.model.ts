import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { hash } from "bcrypt";
import { Profile } from "./profile.model";
import { Subscription } from "./subscription.model";
import { DriverProfile } from "./driver-profile.model";

export enum UserPlan {
  Free = "FREE",
  Premium = "PREMIUM"
}

export enum UserRole {
  Admin = "ADMIN",
  User = "USER"
}

class PasswordHistory {
  @prop()
  password!: string;

  @prop()
  lastUsed!: Date;
}

@pre<User>("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hash(this.password, 8);
  }
  next();
})
@modelOptions({
  schemaOptions: { timestamps: true }
})
export class User {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true, unique: true, index: true })
  public email!: string;

  @prop({ select: false })
  public password!: string;

  @prop({ required: true, default: false })
  public verified!: boolean;

  @prop()
  public phoneNumber?: string;

  @prop()
  public address?: string;

  @prop({ select: false, type: () => [PasswordHistory], default: [] })
  public passwordHistory!: PasswordHistory[];

  @prop({ required: true, enum: UserRole, default: UserRole.User })
  public role!: UserRole;

  @prop({ required: true, enum: UserPlan, default: UserPlan.Free })
  public plan!: UserPlan;

  @prop({ ref: () => Profile })
  public profile!: mongoose.Types.ObjectId;

  @prop({ ref: () => Subscription })
  public subscription?: mongoose.Types.ObjectId;

  @prop({ default: false })
  public isDriver!: boolean;

  @prop({ ref: () => DriverProfile })
  public driverProfile?: mongoose.Types.ObjectId;

  @prop()
  public googleId?: string;

  @prop()
  public paystackCustomerCode?: string;
}

export const UserModel = getModelForClass(User);
