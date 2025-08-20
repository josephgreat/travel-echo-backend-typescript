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
exports.SubscriptionModel = exports.Subscription = exports.SubscriptionType = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
var SubscriptionType;
(function (SubscriptionType) {
    SubscriptionType["Monthly"] = "MONTHLY";
    SubscriptionType["Yearly"] = "YEARLY";
})(SubscriptionType || (exports.SubscriptionType = SubscriptionType = {}));
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: "User" }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Subscription.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Boolean)
], Subscription.prototype, "isActive", void 0);
__decorate([
    (0, typegoose_1.prop)({ enum: SubscriptionType }),
    __metadata("design:type", String)
], Subscription.prototype, "planType", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Subscription.prototype, "paystackSubscriptionCode", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], Subscription.prototype, "startDate", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], Subscription.prototype, "expireDate", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Subscription);
exports.SubscriptionModel = (0, typegoose_1.getModelForClass)(Subscription);
