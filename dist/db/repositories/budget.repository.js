"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetRepository = exports.BudgetRepository = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const budget_model_1 = require("../models/budget.model");
const repository_1 = require("./repository");
const helpers_1 = require("#src/utils/helpers");
class BudgetRepository extends repository_1.Repository {
    constructor() {
        super(budget_model_1.BudgetModel);
    }
    async findBudgetAndExpenses(filter, options = {}) {
        const { skip, limit, select, sort } = options;
        let filters = {};
        if (typeof filter === "string") {
            if (!(0, mongoose_1.isObjectIdOrHexString)(filter)) {
                throw new Error("Invalid ID provided");
            }
            filters._id = (0, helpers_1.castToObjectId)(filter);
        }
        else if (filter instanceof mongoose_1.default.Types.ObjectId) {
            filters._id = filter;
        }
        else {
            filters = { ...filter };
        }
        const mainPipeline = [];
        const expensePipeline = [];
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
        return await this.model.aggregate(mainPipeline);
    }
}
exports.BudgetRepository = BudgetRepository;
exports.budgetRepository = new BudgetRepository();
