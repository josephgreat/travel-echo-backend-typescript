import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { Post } from "./post.model";
import { PostMedia } from "./post-media.model";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Comment {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: "Post" })
  public post!: mongoose.Types.ObjectId;

  @prop({ ref: () => Comment })
  public parentComment?: mongoose.Types.ObjectId;

  @prop({ ref: "PostMedia", type: () => mongoose.Types.ObjectId })
  public media?: mongoose.Types.ObjectId;

  @prop({ required: false })
  public content?: string;

  @prop({ default: 0, required: true })
  public likeCount!: number;

  @prop({ default: 0, required: true })
  public replyCount!: number;

  @prop({ default: 0, required: true })
  public reportedCount!: number;

  @prop({ default: false, required: true })
  public isEdited!: boolean;
}

export const CommentModel = getModelForClass(Comment);
