import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class MemoryImage {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: () => User })
  public memory!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public url!: string;

  @prop({ required: true })
  public publicId!: string;

  @prop()
  public name?: string;

  @prop()
  public assetId?: string;

  @prop()
  public format?: string;

  @prop()
  public bytes?: number;
}

export const MemoryImageModel = getModelForClass(MemoryImage);
