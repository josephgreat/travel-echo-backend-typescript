import { budgetRepository } from "#src/db/repositories/budget.repository";
import { api } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import mongoose from "mongoose";
import { z } from "zod";

const Schema = z.object(
  {
    trip: z
      .string({ message: "Invalid Trip ID" })
      .refine((val) => val === undefined || mongoose.isObjectIdOrHexString(val), {
        message: "Invalid Trip ID"
      })
      .transform((val) => new mongoose.Types.ObjectId(val))
      .optional(),
    name: z.string({ message: "Budget name is required" }),
    plannedAmount: z
      .number({ message: "Planned amount is required" })
      .min(0, { message: "Planned amount cannot be negative" }),
    spentAmount: z
      .number({ message: "Invalid spent amount" })
      .min(0, { message: "Spent amount cannot be negative" })
      .optional(),
    currency: z.string({ message: "Invalid currency" }).optional(),
    notes: z.string({ message: "Invalid notes" }).optional()
  },
  { message: "No request body provided" }
);

export default api(
  {
    group: "/users/me",
    path: "/budgets",
    method: "post",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const data = req.body as z.infer<typeof Schema>;
    const { id } = req.user!;

    const budget = await budgetRepository.create({
      user: id,
      ...data
    });

    return {
      budget
    };
  })
);


/**
 * @api {post} /users/me/budgets
 * @desc Creates a new budget
 * @domain {User: Budgets}
 * @use {ContentAuth}
 * @body {json}
 * {...}
 * @res {json}
 * {
 *   "success": true,
 *   "budget": {
 *      "_id": "string",
 *      "user": "string",
 *      "trip": "string",
 *      "plannedAmount": "number",
 *      "spentAmount": "number",
 *      "currency": "string | optional",
 *      "notes": "string | optional",
 *      "createdAt": "Date",
 *     "updatedAt": "Date"
 *   }
 * }
 */

