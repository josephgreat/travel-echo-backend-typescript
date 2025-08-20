"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverProfileModel = exports.DriverProfile = exports.Car = void 0;
const typegoose_1 = require("@typegoose/typegoose");
class Car {
}
exports.Car = Car;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Car.prototype, "make", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Car.prototype, "model", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Car.prototype, "year", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Car.prototype, "color", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Car.prototype, "licensePlate", void 0);
let DriverProfile = class DriverProfile {
};
exports.DriverProfile = DriverProfile;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: "User" }),
    __metadata("design:type", typegoose_1.mongoose.Types.ObjectId)
], DriverProfile.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Car)
], DriverProfile.prototype, "car", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: false }),
    __metadata("design:type", Boolean)
], DriverProfile.prototype, "isApproved", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], DriverProfile.prototype, "approvedAt", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], DriverProfile.prototype, "licenseDocUrl", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], DriverProfile.prototype, "phoneNumber", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], DriverProfile.prototype, "serviceDescription", void 0);
exports.DriverProfile = DriverProfile = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], DriverProfile);
exports.DriverProfileModel = (0, typegoose_1.getModelForClass)(DriverProfile);
