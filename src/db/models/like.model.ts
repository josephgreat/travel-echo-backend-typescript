import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { Post } from "./post.model";
import { Comment } from "./comment.model";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Like {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: false, ref: () => Post })
  public post?: mongoose.Types.ObjectId;

  @prop({ required: false, ref: () => Comment })
  public comment?: mongoose.Types.ObjectId;
}

export const LikeModel = getModelForClass(Like);
