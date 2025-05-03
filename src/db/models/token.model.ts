import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";

export enum TokenType {
  EmailVerification = "EMAIL_VERIFICATION",
  AccountRecovery = "ACCOUNT_RECOVERY"
}

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Token {
  @prop({ ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public value!: string;

  @prop({ enum: TokenType })
  public type!: TokenType;

  @prop({ type: Date, expires: 0 })
  public expireAt!: Date;
}

export const TokenModel = getModelForClass(Token);
