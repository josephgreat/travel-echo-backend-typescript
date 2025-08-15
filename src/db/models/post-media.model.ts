import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { Post } from "./post.model";
import { Comment } from "./comment.model";
import { CloudinaryImage } from "./models";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class PostMedia extends CloudinaryImage {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ required: true, ref: "Post" })
  public post!: mongoose.Types.ObjectId;

  @prop({ ref: () => Comment })
  public comment?: mongoose.Types.ObjectId;
}

export const PostMediaModel = getModelForClass(PostMedia);
