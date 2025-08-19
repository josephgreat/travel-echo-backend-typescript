import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { Post } from "./post.model";
import { PostMedia } from "./post-media.model";
import { z } from "zod";
import { castToObjectId } from "#src/utils/helpers";
import { MAX_COMMENT_CONTENT_LENGTH } from "#src/utils/constants";

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

  /*  @prop({ ref: "PostMedia", type: () => mongoose.Types.ObjectId })
  public media?: mongoose.Types.ObjectId; */

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

  @prop({ default: false })
  public isReplying!: boolean;
}

export const CommentModel = getModelForClass(Comment);

export const commentSchema = z.object({
  /*   user: z
    .string({ message: "User ID is required" })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "User ID must be a valid MongoDB ObjectId"
    })
    .transform((val) => castToObjectId(val)), */

  /*   post: z
    .string({ message: "Post ID is required" })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Post ID must be a valid MongoDB ObjectId"
    })
    .transform((val) => castToObjectId(val)), */

  parentComment: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Parent comment ID must be a valid MongoDB ObjectId"
    })
    .transform((val) => castToObjectId(val))
    .optional(),

  content: z
    .string({ message: "Content must be a string" })
    .max(MAX_COMMENT_CONTENT_LENGTH, {
      message: `Content must not exceed ${MAX_COMMENT_CONTENT_LENGTH} characters`
    })
});

export type CommentSchema = z.infer<typeof commentSchema>;
