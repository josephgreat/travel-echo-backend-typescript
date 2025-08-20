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
exports.BudgetZodSchema = exports.BudgetModel = exports.Budget = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("./user.model");
const trip_model_1 = require("./trip.model");
const zod_1 = require("zod");
let Budget = class Budget {
};
exports.Budget = Budget;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: () => user_model_1.User }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Budget.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: () => trip_model_1.Trip }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Budget.prototype, "trip", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Budget.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Budget.prototype, "plannedAmount", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], Budget.prototype, "spentAmount", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Budget.prototype, "currency", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Budget.prototype, "notes", void 0);
exports.Budget = Budget = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Budget);
exports.BudgetModel = (0, typegoose_1.getModelForClass)(Budget);
exports.BudgetZodSchema = zod_1.z.object({
    trip: zod_1.z
        .string({ message: "Invalid Trip ID" })
        .refine((val) => val === undefined || mongoose_1.default.isObjectIdOrHexString(val), {
        message: "Invalid Trip ID"
    })
        .nullish()
        .transform((val) => (val ? new mongoose_1.default.Types.ObjectId(val) : undefined)),
    name: zod_1.z.string({ message: "Budget name is required" }),
    plannedAmount: zod_1.z
        .number({ message: "Planned amount is required" })
        .min(0, { message: "Planned amount cannot be negative" }),
    spentAmount: zod_1.z
        .number({ message: "Invalid spent amount" })
        .min(0, { message: "Spent amount cannot be negative" })
        .nullish()
        .transform((val) => (val !== null ? val : undefined)),
    currency: zod_1.z
        .string({ message: "Invalid currency" })
        .nullish()
        .transform((val) => val || undefined),
    notes: zod_1.z
        .string({ message: "Invalid notes" })
        .nullish()
        .transform((val) => val || undefined)
}, {
    message: "No budget data provided"
});
