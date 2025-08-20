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
exports.PlanModel = exports.Plan = exports.BillingOptions = exports.BillingCycle = void 0;
const typegoose_1 = require("@typegoose/typegoose");
var BillingCycle;
(function (BillingCycle) {
    BillingCycle["Monthly"] = "MONTHLY";
    BillingCycle["Yearly"] = "YEARLY";
})(BillingCycle || (exports.BillingCycle = BillingCycle = {}));
class BillingOptions {
}
exports.BillingOptions = BillingOptions;
__decorate([
    (0, typegoose_1.prop)({ enum: BillingCycle, required: true }),
    __metadata("design:type", String)
], BillingOptions.prototype, "billingCycle", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], BillingOptions.prototype, "price", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], BillingOptions.prototype, "paystackPlanCode", void 0);
let Plan = class Plan {
};
exports.Plan = Plan;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Plan.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Plan.prototype, "code", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: "NGN" }),
    __metadata("design:type", String)
], Plan.prototype, "currency", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [String], required: true }),
    __metadata("design:type", Array)
], Plan.prototype, "features", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [BillingOptions], required: true }),
    __metadata("design:type", Array)
], Plan.prototype, "billingOptions", void 0);
exports.Plan = Plan = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Plan);
exports.PlanModel = (0, typegoose_1.getModelForClass)(Plan);
