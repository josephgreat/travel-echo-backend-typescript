"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expense_repository_1 = require("#src/db/repositories/expense.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const http_1 = require("#src/lib/api/http");
const async_busboy_1 = require("#src/utils/async-busboy");
const constants_1 = require("#src/utils/constants");
const helpers_1 = require("#src/utils/helpers");
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.default = (0, api_1.defineApi)({
    group: "/users/me",
    path: "/expenses/:expense_id/receipt",
    method: "put"
}, (0, handlers_1.defineHandler)(async (req) => {
    const { expense_id } = req.params;
    const expense = await expense_repository_1.expenseRepository.findById(expense_id);
    if (!expense) {
        throw http_1.HttpException.notFound("Expense not found");
    }
    const uploader = new async_busboy_1.AsyncBusboy({
        headers: req.headers,
        limits: {
            files: 1,
            fileSize: constants_1.MAX_EXPENSE_RECEIPT_IMAGE_SIZE
        }
    });
    uploader.handler(async (name, file) => {
        const imagePublicId = `${constants_1.EXPENSE_RECEIPT_PUBLIC_ID_PREFIX}${expense_id}_${(0, helpers_1.randomString)(16, "numeric")}`;
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.v2.uploader.upload_stream({
                asset_folder: `${constants_1.CLOUDINARY_BUDGET_FOLDER}/${expense.budget.toString()}`,
                public_id: imagePublicId,
                display_name: imagePublicId,
                unique_filename: true
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (result) {
                    resolve({
                        url: result.secure_url,
                        name: result.display_name,
                        publicId: result.public_id,
                        assetId: result.asset_id,
                        format: result.format,
                        bytes: result.bytes
                    });
                }
                else {
                    reject(new Error("No result from Cloudinary"));
                }
            });
            file.pipe(stream);
        });
    });
    const { error, data } = await uploader.upload(req);
    if (!data || !data[0].data || error) {
        throw http_1.HttpException.badRequest(error?.message || "Upload failed");
    }
    if (expense.receipt) {
        await cloudinary_1.default.v2.uploader.destroy(expense.receipt.publicId, { invalidate: true });
    }
    const updatedExpense = await expense_repository_1.expenseRepository.updateOne(expense_id, { receipt: data[0].data });
    if (!updatedExpense) {
        throw http_1.HttpException.internal("Failed to update expense: Expense not found");
    }
    return {
        receipt: updatedExpense.receipt
    };
}));
/**
 * @api {put} /users/me/expenses/:expense_id/receipt
 * @desc Uploads the expense receipt
 * @domain {User: Expenses}
 * @use {Auth}
 * @par {expense_id} @path The expense ID
 * @body {FormData} Form Data
 * @res {json}
 * {
 *  "success": true,
 *  "receipt": {
 *    "url": "https://res.cloudinary.com/...IMG_PRO_68122116ecccbf17300a8829.png",
 *    "name": "IMG_EXP_RECEIPT_68122116ecccbf17300a8829",
 *    "publicId": "IMG_EXP_RECEIPT_68122116ecccbf17300a8829",
 *    "assetId": "63545234234344",
 *    "format": "jpg",
 *    "bytes": 67541
 *   }
 * }
 */
