import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";
import { z } from "zod";

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

export const MemoryZodSchema = z.object(
  {
    title: z.string({ message: "Title is required" }).min(3, { message: "Title is too short" }),
    description: z.string({ message: "Invalid description provided" }).optional(),
    location: z.string({ message: "Invalid location provided" }).optional(),
    date: z
      .string({ message: "Invalid date provided" })
      .optional()
      .transform((dob) => (dob ? new Date(dob) : undefined)),
    tags: z.array(z.string({ message: "Invalid tag provided" })).optional(),
    isPublic: z.boolean({ message: "Public status should be true or false" }).optional()
  },
  { message: "No request body provided" }
);

export type MemoryZodType = z.infer<typeof MemoryZodSchema>;
