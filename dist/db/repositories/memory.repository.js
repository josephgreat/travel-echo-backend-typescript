"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryRepository = exports.MemoryRepository = void 0;
const mongoose_1 = require("mongoose");
const memory_model_1 = require("../models/memory.model");
const repository_1 = require("./repository");
const helpers_1 = require("#src/utils/helpers");
class MemoryRepository extends repository_1.Repository {
    constructor() {
        super(memory_model_1.MemoryModel);
    }
    async findMemoryByUserId(userId, options) {
        if (!(0, mongoose_1.isObjectIdOrHexString)(userId)) {
            throw new Error("Invalid ID provided");
        }
        const IMAGE_LIMIT = 5;
        const id = (0, helpers_1.castToObjectId)(userId);
        const { where, sort, skip, limit, select, search, title, description, location, tag } = options || {};
        const filters = {
            user: id,
            ...where
        };
        //filters.user = id;
        if (search) {
            const regex = new RegExp(search, "i");
            filters.$or = [{ title: regex }, { location: regex }, { tags: regex }];
        }
        if (title)
            filters.title = new RegExp(title, "i");
        if (location)
            filters.location = new RegExp(location, "i");
        if (tag)
            filters.tags = new RegExp(tag, "i");
        if (description)
            filters.description = new RegExp(description, "i");
        const pipeline = [];
        pipeline.push({ $match: filters });
        pipeline.push({
            $lookup: {
                from: "memoryimages",
                let: { memoryId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$memory", "$$memoryId"] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: IMAGE_LIMIT }
                    //{ $project: { _id: 1, url: 1, publicId: 1  } }
                ],
                as: "images"
            }
        });
        if (select) {
            const parsedSelect = {};
            const selectArray = Array.isArray(select) ? select : [select];
            selectArray.forEach((item) => (parsedSelect[item] = 1));
            pipeline.push({ $project: parsedSelect });
        }
        if (sort)
            pipeline.push({ $sort: this.normalizeSort(sort) });
        if (skip !== undefined)
            pipeline.push({ $skip: skip });
        if (limit !== undefined)
            pipeline.push({ $limit: limit });
        const memories = await this.model.aggregate(pipeline);
        return memories;
    }
}
exports.MemoryRepository = MemoryRepository;
exports.memoryRepository = new MemoryRepository();
