import { UserPlan } from "#src/db/models/user.model";
import { subscriptionRepository } from "#src/db/repositories/subscription-repository";
import { userRepository } from "#src/db/repositories/user.repository";
import { Request, Response, NextFunction } from "express";

export default function premiumOnly() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized. Please, sign in."
        })
      }
      const { subscription } = user;
      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: "You must have an active premium subscription to continue."
        })
      }
      const now = new Date()
      const isSubscriptionValid =
        subscription.isActive &&
        subscription.startDate &&
        subscription.expireDate &&
        new Date(subscription.startDate) <= now &&
        new Date(subscription.expireDate) > now

      if (!isSubscriptionValid) {
        if (user.plan === UserPlan.Premium) {
          await userRepository.updateOne(user.id, { plan: UserPlan.Free })
          await subscriptionRepository.updateOne({ user: user.id}, { isActive: false })

          user.plan = UserPlan.Free
          user.subscription!.isActive = false
        }
        return res.status(403).json({
          success: false,
          message: "You must have an active premium subscription to continue."
        })
      }
      next()
    } catch (error) {
      next(error)
    }
  }
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