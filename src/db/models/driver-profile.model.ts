import { getModelForClass, modelOptions, mongoose, prop } from "@typegoose/typegoose";

export class Car {
  @prop({ required: true })
  public make!: string;

  @prop({ required: true })
  public model!: string;

  @prop({ required: true })
  public year!: number;

  @prop({ required: true })
  public color!: string;

  @prop({ required: true, unique: true })
  public licensePlate!: string;
}

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class DriverProfile {
  @prop({ required: true, ref: "User" })
  public user!: mongoose.Types.ObjectId;

  @prop()
  public car?: Car;

  @prop({ default: false })
  public isApproved!: boolean;

  @prop()
  public approvedAt?: Date;

  @prop()
  public licenseDocUrl?: string;

  @prop()
  public phoneNumber?: string;

  @prop()
  public serviceDescription?: string;
}

export const DriverProfileModel = getModelForClass(DriverProfile);
