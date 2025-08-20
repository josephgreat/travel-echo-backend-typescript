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
exports.PassportZodSchema = exports.PassportModel = exports.Passport = exports.PassportType = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("./user.model");
const models_1 = require("./models");
const zod_1 = require("zod");
const constants_1 = require("#src/utils/constants");
var PassportType;
(function (PassportType) {
    PassportType["Regular"] = "REGULAR";
    PassportType["Official"] = "OFFICIAL";
    PassportType["Diplomatic"] = "DIPLOMATIC";
    PassportType["Service"] = "SERVICE";
    PassportType["Emergency"] = "EMERGENCY";
})(PassportType || (exports.PassportType = PassportType = {}));
let Passport = class Passport {
};
exports.Passport = Passport;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: () => user_model_1.User }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Passport.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Passport.prototype, "passportNumber", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Passport.prototype, "passportType", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Passport.prototype, "fullName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Passport.prototype, "nationality", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Date)
], Passport.prototype, "issueDate", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Date)
], Passport.prototype, "expiryDate", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [models_1.CloudinaryImage], default: [] }),
    __metadata("design:type", Array)
], Passport.prototype, "images", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Passport.prototype, "placeOfIssue", void 0);
exports.Passport = Passport = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Passport);
exports.PassportModel = (0, typegoose_1.getModelForClass)(Passport);
exports.PassportZodSchema = zod_1.z.object({
    user: zod_1.z
        .string({ message: "User ID is required" })
        .refine((value) => mongoose_1.default.isValidObjectId(value), {
        message: "Invalid user ID"
    })
        .transform((value) => new mongoose_1.default.Types.ObjectId(value)),
    passportNumber: zod_1.z
        .string({ message: "Passport number is required" })
        .min(constants_1.MIN_PASSPORT_NUMBER_LENGTH, { message: "Passport number is too short" }),
    passportType: zod_1.z.string({ message: "Passport type is required" }),
    fullName: zod_1.z.string({ message: "Full name is required" }),
    nationality: zod_1.z.string({ message: "Nationality is required" }),
    issueDate: zod_1.z.coerce.date({ message: "Issue date is not a valid date" }),
    expiryDate: zod_1.z.coerce.date({ message: "Expiry date is not a valid date" }),
    placeOfIssue: zod_1.z
        .string({ message: "Place of issue is required" })
        .nullish()
        .transform((val) => val || undefined)
}, {
    message: "No passport data provided"
});
