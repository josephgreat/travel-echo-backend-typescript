import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { PostMedia } from "./post-media.model";
import { z } from "zod";
import { castToObjectId } from "#src/utils/helpers";
import { MAX_POST_CONTENT_LENGTH } from "#src/utils/constants";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class Post {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop({ ref: () => PostMedia, type: () => [mongoose.Types.ObjectId], default: [] })
  public media!: mongoose.Types.ObjectId[];

  @prop({ ref: () => Post })
  public repostedPost?: mongoose.Types.ObjectId;

  @prop({ required: false })
  public content?: string;

  @prop({ type: () => [String], default: [] })
  public tags!: string[];

  @prop({ required: true, default: true })
  public isPublic!: boolean;

  @prop({ default: 0, required: true })
  public likeCount!: number;

  @prop({ default: 0, required: true })
  public commentCount!: number;

  @prop({ default: 0, required: true })
  public repostCount!: number;

  /* @prop({ default: 0, required: true })
  public bookmarkCount!: number;

  @prop({ default: 0, required: true })
  public viewCount!: number;

  @prop({ default: 0, required: true })
  public reportedCount!: number; */

  @prop({ default: false, required: true })
  public isEdited!: boolean;
}

// Computed fields
// isLikedByViewer boolean;
// isBookmarkedByViewer boolean;

export const PostModel = getModelForClass(Post);

export const postSchema = z.object({
  user: z
    .string({ message: "User ID is required" })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "User ID must be a valid MongoDB ObjectId"
    })
    .transform((val) => castToObjectId(val)),

  repostedPost: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Reposted post ID must be a valid MongoDB ObjectId"
    })
    .transform((val) => castToObjectId(val))
    .optional(),

  content: z
    .string({ message: "Content must be a string" })
    .max(MAX_POST_CONTENT_LENGTH, {
      message: `Content must not exceed ${MAX_POST_CONTENT_LENGTH} characters`
    })
    .optional(),

  tags: z
    .array(z.string({ message: "Tag must be a string" }).min(1, { message: "Tag cannot be empty" }))
    .default([]),

  isPublic: z.coerce
    .boolean({ message: "isPublic must be true or false" })
    .default(true)
    .optional(),

  likeCount: z.coerce
    .number({ message: "Like count must be a number" })
    .min(0, { message: "Like count cannot be negative" })
    .default(0)
    .optional(),

  commentCount: z.coerce
    .number({ message: "Comment count must be a number" })
    .min(0, { message: "Comment count cannot be negative" })
    .default(0)
    .optional(),

  repostCount: z.coerce
    .number({ message: "Repost count must be a number" })
    .min(0, { message: "Repost count cannot be negative" })
    .default(0)
    .optional(),

  isEdited: z.boolean({ message: "isEdited must be true or false" }).default(false).optional()
});

export type PostSchema = z.infer<typeof postSchema>;
