import { Expense, ExpenseModel } from "../models/expense.model";
import { Repository } from "./repository";

export class ExpenseRepository extends Repository<Expense> {
  constructor() {
    super(ExpenseModel);
  }
}

export const expenseRepository = new ExpenseRepository();
