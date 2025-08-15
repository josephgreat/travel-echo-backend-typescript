import { expenseRepository } from "#src/db/repositories/expense.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { CLOUDINARY_BUDGET_FOLDER } from "#src/utils/constants";
import cloudinary from "cloudinary";

/**
 * @api {delete} /users/me/expenses/:expense_id/receipt
 * @domain {User: Expenses}
 * @desc Deletes the expense receipt
 * @use {Auth}
 * @res {json} { "success": true, "message": "Expense receipt deleted successfully" }
 */
export default defineApi(
  {
    group: "/users/me",
    path: "/expenses/:expense_id/receipt",
    method: "delete"
  },
  defineHandler(async (req) => {
    const { id } = req.user!;
    const { expense_id } = req.params;
    const expense = await expenseRepository.findOne({ _id: expense_id, user: id });

    if (!expense) {
      throw HttpException.notFound("Expense not found");
    }

    const { receipt } = expense;

    if (!receipt) {
      return HttpException.notFound("No previous receipt image");
    }

    try {
      await cloudinary.v2.uploader.destroy(receipt.publicId, { invalidate: true });
      await cloudinary.v2.api.delete_folder(
        `${CLOUDINARY_BUDGET_FOLDER}/${expense.budget.toString()}`
      );
      await expenseRepository.updateOne({ _id: expense_id, user: id }, { receipt: undefined });
      return {
        success: true,
        message: "Profile image removed succesfully"
      };
    } catch (error) {
      throw HttpException.internal(`Failed to delete image: ${(error as Error).message}`);
    }
  })
);
