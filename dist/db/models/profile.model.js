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
exports.ProfileModel = exports.Profile = exports.School = exports.Gender = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const helpers_1 = require("#src/utils/helpers");
const constants_1 = require("#src/utils/constants");
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("./models");
var Gender;
(function (Gender) {
    Gender["Male"] = "MALE";
    Gender["Female"] = "FEMALE";
    Gender["Other"] = "OTHER";
})(Gender || (exports.Gender = Gender = {}));
class School {
}
exports.School = School;
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], School.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], School.prototype, "country", void 0);
let Profile = class Profile {
};
exports.Profile = Profile;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: "User" }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Profile.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], Profile.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typegoose_1.prop)({ enum: Gender }),
    __metadata("design:type", String)
], Profile.prototype, "gender", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", models_1.CloudinaryImage)
], Profile.prototype, "image", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Profile.prototype, "location", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", School)
], Profile.prototype, "school", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Profile.prototype, "occupation", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [String] }),
    __metadata("design:type", Array)
], Profile.prototype, "interests", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [String] }),
    __metadata("design:type", Array)
], Profile.prototype, "languages", void 0);
exports.Profile = Profile = __decorate([
    (0, typegoose_1.pre)("save", async function (next) {
        if (this.dateOfBirth && this.isModified("dateOfBirth")) {
            const age = (0, helpers_1.computeAge)(this.dateOfBirth);
            if (age < constants_1.MIN_USER_AGE) {
                return next(new Error(`You must be at least ${constants_1.MIN_USER_AGE} years old.`));
            }
        }
        next();
    }),
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Profile);
exports.ProfileModel = (0, typegoose_1.getModelForClass)(Profile);
