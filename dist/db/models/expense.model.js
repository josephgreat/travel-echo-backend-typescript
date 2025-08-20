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
exports.ExpenseModel = exports.Expense = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("./user.model");
const trip_model_1 = require("./trip.model");
const budget_model_1 = require("./budget.model");
const models_1 = require("./models");
let Expense = class Expense {
};
exports.Expense = Expense;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: () => user_model_1.User }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Expense.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: () => trip_model_1.Trip }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Expense.prototype, "trip", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: () => budget_model_1.Budget }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Expense.prototype, "budget", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Expense.prototype, "title", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Expense.prototype, "category", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Number)
], Expense.prototype, "plannedAmount", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Expense.prototype, "actualAmount", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Expense.prototype, "notes", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", models_1.CloudinaryImage)
], Expense.prototype, "receipt", void 0);
exports.Expense = Expense = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Expense);
exports.ExpenseModel = (0, typegoose_1.getModelForClass)(Expense);
