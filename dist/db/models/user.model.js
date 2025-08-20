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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.User = exports.UserRole = exports.UserPlan = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = require("bcrypt");
const profile_model_1 = require("./profile.model");
const subscription_model_1 = require("./subscription.model");
const driver_profile_model_1 = require("./driver-profile.model");
var UserPlan;
(function (UserPlan) {
    UserPlan["Free"] = "FREE";
    UserPlan["Premium"] = "PREMIUM";
})(UserPlan || (exports.UserPlan = UserPlan = {}));
var UserRole;
(function (UserRole) {
    UserRole["Admin"] = "ADMIN";
    UserRole["User"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
class PasswordHistory {
}
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], PasswordHistory.prototype, "password", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], PasswordHistory.prototype, "lastUsed", void 0);
let User = class User {
};
exports.User = User;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typegoose_1.prop)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "verified", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], User.prototype, "address", void 0);
__decorate([
    (0, typegoose_1.prop)({ select: false, type: () => [PasswordHistory], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "passwordHistory", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, enum: UserRole, default: UserRole.User }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, enum: UserPlan, default: UserPlan.Free }),
    __metadata("design:type", String)
], User.prototype, "plan", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: () => profile_model_1.Profile }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], User.prototype, "profile", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: () => subscription_model_1.Subscription }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], User.prototype, "subscription", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isDriver", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: () => driver_profile_model_1.DriverProfile }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], User.prototype, "driverProfile", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], User.prototype, "googleId", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], User.prototype, "paystackCustomerCode", void 0);
exports.User = User = __decorate([
    (0, typegoose_1.pre)("save", async function (next) {
        if (this.isModified("password")) {
            this.password = await (0, bcrypt_1.hash)(this.password, 8);
        }
        next();
    }),
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], User);
exports.UserModel = (0, typegoose_1.getModelForClass)(User);
