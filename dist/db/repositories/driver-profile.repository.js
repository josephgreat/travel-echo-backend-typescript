"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverProfileRepository = exports.DriverProfileRepository = void 0;
const driver_profile_model_1 = require("../models/driver-profile.model");
const repository_1 = require("./repository");
class DriverProfileRepository extends repository_1.Repository {
    constructor() {
        super(driver_profile_model_1.DriverProfileModel);
    }
}
exports.DriverProfileRepository = DriverProfileRepository;
exports.driverProfileRepository = new DriverProfileRepository();
