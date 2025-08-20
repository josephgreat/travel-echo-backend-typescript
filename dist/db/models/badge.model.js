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
exports.BadgeZodSchema = exports.BadgeModel = exports.Badge = exports.BadgeCategory = exports.BadgeOperator = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const zod_1 = require("zod");
var BadgeOperator;
(function (BadgeOperator) {
    BadgeOperator["EQ"] = "EQ";
    BadgeOperator["GT"] = "GT";
    BadgeOperator["GTE"] = "GTE";
    BadgeOperator["LT"] = "LT";
    BadgeOperator["LTE"] = "LTE";
})(BadgeOperator || (exports.BadgeOperator = BadgeOperator = {}));
var BadgeCategory;
(function (BadgeCategory) {
    BadgeCategory["Trip"] = "TRIP";
    BadgeCategory["Memory"] = "MEMORY";
    BadgeCategory["Budget"] = "BUDGET";
})(BadgeCategory || (exports.BadgeCategory = BadgeCategory = {}));
let Badge = class Badge {
};
exports.Badge = Badge;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Badge.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Badge.prototype, "description", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Badge.prototype, "level", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, enum: BadgeCategory }),
    __metadata("design:type", String)
], Badge.prototype, "category", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, enum: BadgeOperator }),
    __metadata("design:type", String)
], Badge.prototype, "operator", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Badge.prototype, "value", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Badge.prototype, "iconUrl", void 0);
exports.Badge = Badge = __decorate([
    (0, typegoose_1.modelOptions)({ schemaOptions: { timestamps: true } }),
    (0, typegoose_1.index)({ level: 1, category: 1 }, { unique: true })
], Badge);
exports.BadgeModel = (0, typegoose_1.getModelForClass)(Badge);
exports.BadgeZodSchema = zod_1.z.object({
    name: zod_1.z
        .string({ message: "Badge name is required" })
        .nonempty({ message: "Badge name is required" }),
    description: zod_1.z
        .string({ message: "Badge description is required" })
        .nonempty({ message: "Badge description is required" }),
    level: zod_1.z.coerce
        .number({ message: "Badge level must be a number" })
        .min(1, { message: "Badge level must be greater than 0" }),
    category: zod_1.z.enum([BadgeCategory.Memory, BadgeCategory.Trip, BadgeCategory.Budget], {
        message: `Badge category must be ${BadgeCategory.Memory}. ${BadgeCategory.Budget}, or ${BadgeCategory.Trip}`
    }),
    operator: zod_1.z.enum(["EQ", "GT", "GTE", "LT", "LTE"], {
        message: `Badge operator must be EQ, GT, GTE, LT, or LTE`
    }),
    value: zod_1.z.coerce
        .number({ message: "Value must be a number" })
        .nonnegative({ message: "Value cannot be negative" }),
    iconUrl: zod_1.z.string({ message: "Invalid icon URL" }).optional()
});
