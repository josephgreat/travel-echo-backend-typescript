import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class MemoryImage {
  @prop({ required: true })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true })
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
