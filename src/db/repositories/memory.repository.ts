import mongoose, { isObjectIdOrHexString, PipelineStage } from "mongoose";
import { Memory, MemoryModel } from "../models/memory.model";
import { Repository } from "./repository";
import { castToObjectId } from "#src/utils/helpers";
import { RepositoryQueryOptions } from "./repository";
import { MemoryImage } from "../models/memory-image.model";

export interface FindMemoryByUserIdOptions extends RepositoryQueryOptions<Memory> {
  search?: string;
  title?: string;
  description?: string;
  location?: string;
  tag?: string;
  where?: Record<string, unknown>;
}

export interface FindMemoryByUserIdResult extends Memory {
  images: Pick<MemoryImage, "url" | "publicId">[];
}

export class MemoryRepository extends Repository<Memory> {
  constructor() {
    super(MemoryModel);
  }

  async findMemoryByUserId(
    userId: string | mongoose.Types.ObjectId,
    options?: FindMemoryByUserIdOptions
  ) {
    if (!isObjectIdOrHexString(userId)) {
      throw new Error("Invalid ID provided");
    }
    const IMAGE_LIMIT = 5;
    const id = castToObjectId(userId);
    const { where, sort, skip, limit, select, search, title, description, location, tag } =
      options || {};

    const filters: Record<string, unknown> = {
      user: id,
      ...where
    };

    //filters.user = id;
    if (search) {
      const regex = new RegExp(search, "i");
      filters.$or = [{ title: regex }, { location: regex }, { tags: regex }];
    }
    if (title) filters.title = new RegExp(title, "i");
    if (location) filters.location = new RegExp(location, "i");
    if (tag) filters.tags = new RegExp(tag, "i");
    if (description) filters.description = new RegExp(description, "i");

    const pipeline: PipelineStage[] = [];

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
      const parsedSelect: Record<string, 1> = {};
      const selectArray = Array.isArray(select) ? select : [select];
      selectArray.forEach((item) => (parsedSelect[item] = 1));
      pipeline.push({ $project: parsedSelect });
    }
    if (sort) pipeline.push({ $sort: this.normalizeSort(sort) });
    if (skip !== undefined) pipeline.push({ $skip: skip });
    if (limit !== undefined) pipeline.push({ $limit: limit });

    const memories = await this.model.aggregate<FindMemoryByUserIdResult>(pipeline);
    return memories;
  }
}

export const memoryRepository = new MemoryRepository();
