"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseRepository = exports.ExpenseRepository = void 0;
const expense_model_1 = require("../models/expense.model");
const repository_1 = require("./repository");
class ExpenseRepository extends repository_1.Repository {
    constructor() {
        super(expense_model_1.ExpenseModel);
    }
}
exports.ExpenseRepository = ExpenseRepository;
exports.expenseRepository = new ExpenseRepository();
