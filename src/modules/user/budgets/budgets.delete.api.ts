import { budgetRepository } from "#src/db/repositories/budget.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { CLOUDINARY_BUDGET_FOLDER } from "#src/utils/constants";
import deleteBudgetExpenses from "./services/delete-budget-expenses";
import cloudinary from "cloudinary";

export default defineApi(
  {
    group: "/users/me",
    path: "/budgets/:budget_id",
    method: "delete"
  },
  defineHandler(async (req) => {
    const { budget_id } = req.params;

    const budget = await budgetRepository.findById(budget_id);

    if (!budget) {
      throw HttpException.notFound("Budget not found");
    }

    const { count } = await deleteBudgetExpenses(budget._id);

    await Promise.all([
      budgetRepository.deleteOne(budget._id),
      cloudinary.v2.api.delete_folder(`${CLOUDINARY_BUDGET_FOLDER}/${budget_id}`)
    ]);

    return {
      expensesDeleted: count,
      message: "Budget and all expenses deleted successfully"
    };
  })
);

/**
 * @api {delete} /users/me/budgets/:budget_id
 * @desc Deletes a budget and all its expenses
 * @domain {User: Budgets}
 * @header {Authorization} Bearer <token>
 * @par {budget_id} @path The budget ID
 * @res {json}
 * {
 *  "success": true,
 *  "message": "Budget and all expenses deleted successfully",
 *  "expensesDeleted": "number"
 * }
 */
