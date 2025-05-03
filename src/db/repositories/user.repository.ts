import { User, UserModel } from "../models/user.model";
import { Repository } from "./repository";

export class UserRepository extends Repository<User> {
  constructor() {
    super(UserModel);
  }
}

export const userRepository = new UserRepository();
