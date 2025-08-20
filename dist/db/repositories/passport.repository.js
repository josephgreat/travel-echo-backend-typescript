"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passportRepository = exports.PassportRepository = void 0;
const passport_model_1 = require("../models/passport.model");
const repository_1 = require("./repository");
class PassportRepository extends repository_1.Repository {
    constructor() {
        super(passport_model_1.PassportModel);
    }
}
exports.PassportRepository = PassportRepository;
exports.passportRepository = new PassportRepository();
