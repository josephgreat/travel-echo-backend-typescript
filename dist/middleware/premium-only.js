"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = premiumOnly;
const user_model_1 = require("#src/db/models/user.model");
const subscription_repository_1 = require("#src/db/repositories/subscription.repository");
const user_repository_1 = require("#src/db/repositories/user.repository");
function premiumOnly(allowNonPremium = false) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Not authorized. Please, sign in."
                });
            }
            const subscription = await subscription_repository_1.subscriptionRepository.findOne({ user: user.id });
            if (!allowNonPremium && !subscription) {
                return res.status(403).json({
                    success: false,
                    message: "You must have an active premium subscription to continue."
                });
            }
            const now = new Date();
            const isSubscriptionValid = subscription?.isActive &&
                subscription?.startDate &&
                subscription?.expireDate &&
                new Date(subscription.startDate) <= now &&
                new Date(subscription.expireDate) > now;
            user.subscription = subscription || undefined;
            user.isSubscriptionValid = isSubscriptionValid;
            if (!isSubscriptionValid) {
                if (user.plan === user_model_1.UserPlan.Premium) {
                    await Promise.all([
                        user_repository_1.userRepository.updateOne(user.id, { plan: user_model_1.UserPlan.Free }),
                        subscription_repository_1.subscriptionRepository.updateOne({ user: user.id }, { isActive: false })
                    ]);
                    user.plan = user_model_1.UserPlan.Free;
                    if (user.subscription)
                        user.subscription.isActive = false;
                }
                if (!allowNonPremium) {
                    return res.status(403).json({
                        success: false,
                        message: "You must have an active premium subscription to continue."
                    });
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * const User = require('../models/user.model') // adjust path as needed

const checkSubscription = (premiumOnly = false) => {
  return async (req, res, next) => {
    try {
      const user = req.user

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized. Please sign in.'
        })
      }

      const now = new Date()
      const isSubscriptionValid =
        user.subscription?.isActive &&
        user.subscription.startedAt &&
        user.subscription.expiresAt &&
        new Date(user.subscription.startedAt) <= now &&
        new Date(user.subscription.expiresAt) > now

      // Auto-downgrade if expired
      if (!isSubscriptionValid && user.plan === 'PREMIUM') {
        await User.findByIdAndUpdate(user.id, {
          plan: 'FREE',
          subscription: {
            ...user.subscription,
            isActive: false
          }
        })
        user.plan = 'FREE' // Update in-memory user
        user.subscription.isActive = false
      }

      const isPremiumUser = user.plan === 'PREMIUM' && isSubscriptionValid
      req.isPremiumUser = isPremiumUser

      if (premiumOnly && !isPremiumUser) {
        return res.status(403).json({
          success: false,
          message: 'You must have an active premium subscription to continue.'
        })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = checkSubscription

 */
