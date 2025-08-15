import { CloudinaryImage } from "#src/db/models/models";
import { expenseRepository } from "#src/db/repositories/expense.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpException } from "#src/lib/api/http";
import { AsyncBusboy } from "#src/utils/async-busboy";
import {
  CLOUDINARY_BUDGET_FOLDER,
  EXPENSE_RECEIPT_PUBLIC_ID_PREFIX,
  MAX_EXPENSE_RECEIPT_IMAGE_SIZE
} from "#src/utils/constants";
import { randomString } from "#src/utils/helpers";
import cloudinary from "cloudinary";

export default defineApi(
  {
    group: "/users/me",
    path: "/expenses/:expense_id/receipt",
    method: "put"
  },
  defineHandler(async (req) => {
    const { expense_id } = req.params;

    const expense = await expenseRepository.findById(expense_id);

    if (!expense) {
      throw HttpException.notFound("Expense not found");
    }

    const uploader = new AsyncBusboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_EXPENSE_RECEIPT_IMAGE_SIZE
      }
    });

    uploader.handler(async (name, file) => {
      const imagePublicId = `${EXPENSE_RECEIPT_PUBLIC_ID_PREFIX}${expense_id}_${randomString(16, "numeric")}`;

      return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            asset_folder: `${CLOUDINARY_BUDGET_FOLDER}/${expense.budget.toString()}`,
            public_id: imagePublicId,
            display_name: imagePublicId,
            unique_filename: true
          },
          (error, result) => {
            if (error) return reject(error);

            if (result) {
              resolve({
                url: result.secure_url,
                name: result.display_name,
                publicId: result.public_id,
                assetId: result.asset_id,
                format: result.format,
                bytes: result.bytes
              });
            } else {
              reject(new Error("No result from Cloudinary"));
            }
          }
        );

        file.pipe(stream);
      });
    });

    const { error, data } = await uploader.upload<CloudinaryImage>(req);

    if (!data || !data[0].data || error) {
      throw HttpException.badRequest(error?.message || "Upload failed");
    }

    if (expense.receipt) {
      await cloudinary.v2.uploader.destroy(expense.receipt.publicId, { invalidate: true });
    }

    const updatedExpense = await expenseRepository.updateOne(expense_id, { receipt: data[0].data });

    if (!updatedExpense) {
      throw HttpException.internal("Failed to update expense: Expense not found");
    }

    return {
      receipt: updatedExpense.receipt
    };
  })
);

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
