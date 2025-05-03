import { Subscription, SubscriptionModel } from "../models/subscription.model";
import { Repository } from "./repository";

export class SubscriptionRepository extends Repository<Subscription> {
  constructor() {
    super(SubscriptionModel);
  }
}

export const subscriptionRepository = new SubscriptionRepository();
