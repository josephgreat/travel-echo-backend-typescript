import { prop } from "@typegoose/typegoose";

export class CloudinaryImage {
  @prop()
  public url!: string;

  @prop()
  public name!: string;

  @prop()
  public publicId!: string;

  @prop()
  public assetId!: string;

  @prop()
  public format!: string;

  @prop()
  public bytes!: number;
}
