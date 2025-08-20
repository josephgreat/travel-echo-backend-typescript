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
exports.PaymentModel = exports.Payment = exports.PaymentChannel = exports.PaymentStatus = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
const plan_model_1 = require("./plan.model");
const user_model_1 = require("./user.model");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["Success"] = "SUCCESS";
    PaymentStatus["Failed"] = "FAILED";
    PaymentStatus["Abandoned"] = "ABANDONED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentChannel;
(function (PaymentChannel) {
    PaymentChannel["Card"] = "CARD";
    PaymentChannel["Bank"] = "BANK";
    PaymentChannel["Ussd"] = "USSD";
})(PaymentChannel || (exports.PaymentChannel = PaymentChannel = {}));
let Payment = class Payment {
};
exports.Payment = Payment;
__decorate([
    (0, typegoose_1.prop)({ ref: () => user_model_1.User }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Payment.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Payment.prototype, "reference", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Payment.prototype, "amount", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: "NGN" }),
    __metadata("design:type", String)
], Payment.prototype, "currency", void 0);
__decorate([
    (0, typegoose_1.prop)({ enum: PaymentStatus, required: true }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    (0, typegoose_1.prop)({ enum: PaymentChannel }),
    __metadata("design:type", String)
], Payment.prototype, "channel", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Payment.prototype, "gateway_response", void 0);
__decorate([
    (0, typegoose_1.prop)({ enum: plan_model_1.BillingCycle }),
    __metadata("design:type", String)
], Payment.prototype, "planType", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], Payment.prototype, "paidAt", void 0);
exports.Payment = Payment = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Payment);
exports.PaymentModel = (0, typegoose_1.getModelForClass)(Payment);
