import { Subscription } from "#src/db/models/subscription.model";
import { UserPlan, UserRole } from "#src/db/models/user.model";
import mongoose from "mongoose";

export interface AuthUser {
  id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  verified: boolean;
  role: UserRole;
  plan: UserPlan;
  subscription?: Subscription;
  isSubscriptionValid?: boolean;
  profile: mongoose.Types.ObjectId;
  token?: string;
}
