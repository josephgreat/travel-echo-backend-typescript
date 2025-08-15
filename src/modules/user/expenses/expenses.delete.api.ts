import { expenseRepository } from "#src/db/repositories/expense.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler, defineValidator } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { PROCESSING_BATCH_SIZE } from "#src/utils/constants";
import cloudinary from "cloudinary";
import { DeleteResult } from "mongoose";
import { z } from "zod";

export const deleteSingleExpense = defineApi(
  {
    group: "/users/me",
    path: "/expenses/:expense_id",
    method: "delete"
  },
  defineHandler(async (req) => {
    const { expense_id } = req.params;

    const expense = await expenseRepository.findById(expense_id);

    if (!expense) {
      throw HttpException.notFound("Expense not found");
    }

    const promises: unknown[] = [];

    promises.push(expenseRepository.deleteOne(expense._id));

    if (expense.receipt) {
      promises.push(cloudinary.v2.uploader.destroy(expense.receipt.publicId, { invalidate: true }));
    }

    return {
      message: "Expense deleted successfully"
    };
  })
);

/**
 * @api {delete} /users/me/expenses/:expense_id
 * @desc Deletes an expense and its receipt if it exists
 * @domain {User: Expenses}
 * @header {Authorization} Bearer <token>
 * @par {expense_id} @path The expense ID
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Expense deleted successfully",
 * }
 */

const Schema = z
  .array(z.string({ message: "Expense ID is required" }), { message: "No expense IDs provided" })
  .max(PROCESSING_BATCH_SIZE, {
    message: `Only ${PROCESSING_BATCH_SIZE} expense IDs are allowed at a time`
  });

export const deleteMultipleExpenses = defineApi(
  {
    group: "/users/me",
    path: "/expenses/delete",
    method: "patch",
    middleware: defineValidator("body", Schema)
  },
  defineHandler(async (req) => {
    const expenseIds = req.validatedBody as z.infer<typeof Schema>;

    const expenses = await expenseRepository.raw().find({ _id: { $in: expenseIds } });

    if (expenses.length === 0) {
      throw HttpException.notFound("No expenses found");
    }

    const receiptsPublicIds = expenses
      .map((expense) => expense.receipt?.publicId)
      .filter((publicId) => publicId !== undefined);

    const promises: [Promise<DeleteResult>, Promise<unknown>?] = [
      expenseRepository.deleteMany({}, { in: { _id: expenseIds } })
    ];

    if (receiptsPublicIds.length > 0) {
      promises.push(cloudinary.v2.api.delete_resources(receiptsPublicIds, { invalidate: true }));
    }

    const [result] = await Promise.all(promises);

    return {
      message: "Expenses deleted successfully",
      expensesDeleted: result.deletedCount
    };
  })
);

/**
 * @api {patch} /users/me/expenses/delete
 * @desc Deletes a list of expenses
 * @domain {User: Expenses}
 * @header {Authorization} Bearer <token>
 * @bodyDesc {A list of not more than 100 expense IDs}
 * @body {json} ["id_1", "id_2", "..."]
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Expense deleted successfully",
 *  "expensesDeleted": "number"
 * }
 */
