import { Budget, BudgetModel } from "../models/budget.model";
import { Repository } from "./repository";

export class BudgetRepository extends Repository<Budget> {
  constructor() {
    super(BudgetModel);
  }
}

export const budgetRepository = new BudgetRepository();
