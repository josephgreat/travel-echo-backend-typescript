"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRepository = exports.SubscriptionRepository = void 0;
const subscription_model_1 = require("../models/subscription.model");
const repository_1 = require("./repository");
class SubscriptionRepository extends repository_1.Repository {
    constructor() {
        super(subscription_model_1.SubscriptionModel);
    }
}
exports.SubscriptionRepository = SubscriptionRepository;
exports.subscriptionRepository = new SubscriptionRepository();
