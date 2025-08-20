"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const user_model_1 = require("../models/user.model");
const repository_1 = require("./repository");
class UserRepository extends repository_1.Repository {
    constructor() {
        super(user_model_1.UserModel);
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
