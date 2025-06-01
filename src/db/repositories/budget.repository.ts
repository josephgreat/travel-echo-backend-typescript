import mongoose, { isObjectIdOrHexString, PipelineStage } from "mongoose";
import { Budget, BudgetModel } from "../models/budget.model";
import { Fields, Repository, RepositoryQueryOptions } from "./repository";
import { castToObjectId } from "#src/utils/helpers";
import { Expense } from "../models/expense.model";

interface BudgetWithExpenses extends Budget {
  expenses: Expense[];
}

export class BudgetRepository extends Repository<Budget> {
  constructor() {
    super(BudgetModel);
  }

  async findBudgetAndExpenses(
    filter: string | mongoose.Types.ObjectId | Partial<Fields<Budget>>,
    options: RepositoryQueryOptions<Budget> = {}
  ) {
    const { skip, limit, select, sort } = options;

    let filters: Partial<Fields<Budget>> = {};

    if (typeof filter === "string") {
      if (!isObjectIdOrHexString(filter)) {
        throw new Error("Invalid ID provided");
      }
      filters._id = castToObjectId(filter);
    } else if (filter instanceof mongoose.Types.ObjectId) {
      filters._id = filter;
    } else {
      filters = { ...filter };
    }

    const mainPipeline: PipelineStage[] = [];
    const expensePipeline: PipelineStage.FacetPipelineStage[] = [];

    if (skip && skip > 0) {
      expensePipeline.push({ $skip: skip });
    }

    if (limit && limit > 0) {
      expensePipeline.push({ $limit: limit });
    }

    if (select) {
      const selectArray = Array.isArray(select) ? select : [select];
      const projection = Object.fromEntries(selectArray.map((field) => [field, 1]));
      expensePipeline.push({ $project: projection });
    }

    if (sort) {
      expensePipeline.push({ $sort: this.normalizeSort(sort) });
    }

    mainPipeline.push({ $match: filters });

    mainPipeline.push({
      $lookup: {
        from: "expenses",
        let: { budgetId: "$_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$budget", "$$budgetId"] } } }, ...expensePipeline],
        as: "expenses"
      }
    });

    return await this.model.aggregate<BudgetWithExpenses>(mainPipeline);
  }
}

export const budgetRepository = new BudgetRepository();
