import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Memory {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public title!: string;

  @prop()
  public description?: string;

  @prop()
  public location?: string;

  @prop()
  public date?: Date;

  @prop({ type: () => [String], default: [] })
  public tags?: string[];

  @prop({ type: Boolean, default: true })
  public isPublic?: boolean;

  @prop({ type: Number, default: 0 })
  public imageCount?: number;
}

export const MemoryModel = getModelForClass(Memory);
