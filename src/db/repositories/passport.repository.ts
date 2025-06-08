import { Passport, PassportModel } from "../models/passport.model";
import { Repository } from "./repository";

export class PassportRepository extends Repository<Passport> {
  constructor() {
    super(PassportModel);
  }
}

export const passportRepository = new PassportRepository();
