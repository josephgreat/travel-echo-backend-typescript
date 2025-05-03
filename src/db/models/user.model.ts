import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { hash } from "bcrypt";

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

  @prop({ select: false, type: () => [PasswordHistory], default: [] })
  public passwordHistory!: PasswordHistory[];

  @prop({ required: true, default: false })
  public verified!: boolean;

  @prop({ required: true, enum: UserRole, default: UserRole.User })
  public role!: UserRole;

  @prop({ required: true, enum: UserPlan, default: UserPlan.Free })
  public plan!: UserPlan;

  @prop()
  public profile!: mongoose.Types.ObjectId;

  @prop()
  public subscription?: mongoose.Types.ObjectId;

  @prop()
  public googleId?: string;

  @prop()
  public paystackCustomerCode?: string;
}

export const UserModel = getModelForClass(User);
