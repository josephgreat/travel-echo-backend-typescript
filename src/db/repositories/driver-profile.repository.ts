import { DriverProfile, DriverProfileModel } from "../models/driver-profile.model";
import { Repository } from "./repository";

export class DriverProfileRepository extends Repository<DriverProfile> {
  constructor() {
    super(DriverProfileModel);
  }
}

export const driverProfileRepository = new DriverProfileRepository();
