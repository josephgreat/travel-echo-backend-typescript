import { ReturnModelType } from "@typegoose/typegoose";
import { Request } from "express";
import { ParsedQuery } from "#src/middleware/parse-request-query";
import mongoose, { isObjectIdOrHexString } from "mongoose";

export type MongooseIdField = { _id: string | mongoose.Types.ObjectId };

/* export interface Fields<T> extends ModelType {
  _id: string | mongoose.Types.ObjectId
} */

export type Fields<T> = T & { _id: string | mongoose.Types.ObjectId };

export interface RepositoryQueryOptions<T> {
  select?: string | string[];
  include?: string | string[];
  exclude?: string | string[];
  populate?: string | string[] | { path: string; select?: string | string[] }[];
  limit?: number;
  skip?: number;
  sort?: { [key: string]: "ASC" | "DESC" | 1 | -1 };

  filters?: QueryFilterOptions<T>;
}

export interface QueryFilterOptions<T> {
  isNot?: Partial<Record<keyof Fields<T>, Fields<T>[keyof Fields<T>]>>;
  in?: Partial<Record<keyof Fields<T>, Array<Fields<T>[keyof Fields<T>]>>>;
}

export class Repository<T> {
  constructor(protected readonly model: ReturnModelType<new () => T>) {}

  async findOne(fields: Partial<Fields<T>>, options?: RepositoryQueryOptions<T>) {
    let query = this.model.findOne(fields);
    query = this.applyQueryOptions(query, options);
    return await query.lean();
  }

  async findMany(fields: Partial<T>, options?: RepositoryQueryOptions<T>) {
    let query = this.model.find(fields);
    query = this.applyQueryOptions(query, options);
    return await query.lean();
  }

  async findOneWithParsedRequestQuery(req: Request, fields: Partial<Fields<T>> = {}) {
    const { populate, select, where } = req.parsedQuery || {};

    const filter: Partial<Fields<T>> = { ...fields };

    if (where) {
      const validKeys = Array.from(new Set(["_id", ...Object.keys(this.model.schema.paths)]));
      for (const key of Object.keys(where)) {
        if (validKeys.includes(key)) {
          const typedKey = key as keyof Fields<T>;
          // @ts-expect-error (unknown value of where[typedKey])
          filter[typedKey] = where[typedKey];
        }
      }
    }

    return this.findOne(filter, { populate, select });
  }

  async findManyWithParsedRequestQuery(
    fields: Partial<T> = {},
    req: Request,
    keys?: { [K in keyof ParsedQuery]?: true | ParsedQuery[K] | { value: ParsedQuery[K] } }
  ) {
    const parsed = req.parsedQuery || {};

    // Helper function to resolve value from keys override
    const resolveKey = <K extends keyof ParsedQuery>(key: K): ParsedQuery[K] | undefined => {
      const override = keys?.[key];
      if (override === true) {
        return parsed[key];
      }
      if (override && typeof override === "object" && "value" in override) {
        return override.value as ParsedQuery[K];
      }
      if (override) {
        return override as ParsedQuery[K];
      }
      return parsed[key];
    };

    const limit = resolveKey("limit");
    const populate = resolveKey("populate");
    const select = resolveKey("select");
    const skip = resolveKey("skip");
    const sort = resolveKey("sort");
    const where = resolveKey("where");

    const filter = { ...fields };
    if (where && typeof where === "object") {
      const validKeys = Object.keys(this.model.schema.paths);
      for (const key of Object.keys(where)) {
        if (validKeys.includes(key)) {
          filter[key as keyof T] = where[key] as T[keyof T];
        }
      }
    }

    return this.findMany(filter, {
      limit,
      populate,
      select,
      skip,
      sort
    });
  }

  async findById(id: string | mongoose.Types.ObjectId, options?: RepositoryQueryOptions<T>) {
    if (!isObjectIdOrHexString(id)) {
      throw new Error("Invalid ID provided");
    }
    let query = this.model.findById(id);
    query = this.applyQueryOptions(query, options);
    return await query.lean();
  }

  async findOrCreate(
    fields: Partial<Fields<T>>,
    data: Partial<T>,
    options?: RepositoryQueryOptions<T>
  ) {
    const doc = await this.findOne(fields, options);
    if (!doc) {
      return await this.create(data);
    }
    return doc;
  }

  async create(fields: Partial<T>) {
    return (await this.model.create(fields)).toObject();
  }

  async upsert(
    filter: Partial<Fields<T>>,
    updateFields: Partial<T>,
    options: {
      returning?: boolean;
      runValidators?: boolean;
    } = {}
  ) {
    const { returning = false, runValidators = true } = options;

    const { set, unset } = this.getSetAndUnsetFields(updateFields);

    const doc = await this.model.findOneAndUpdate(
      filter,
      { $set: set, $unset: unset },
      {
        upsert: true,
        new: returning,
        runValidators,
        setDefaultsOnInsert: true
      }
    );

    return returning ? doc?.toObject() : undefined;
  }

  async insertMany(
    docs: Partial<T>[],
    options: {
      ordered?: boolean;
      rawResult?: boolean;
    } = {}
  ) {
    return await this.model.insertMany(docs, {
      ordered: options.ordered ?? true,
      rawResult: options.rawResult ?? false
    });
  }

  async updateOne(
    filter: Partial<Fields<T>> | string | mongoose.Types.ObjectId,
    updateFields: Partial<T>,
    options: {
      returning?: boolean;
      runValidators?: boolean;
    } = {}
  ) {
    const { returning = false, runValidators = true } = options;

    const isId = typeof filter === "string" || mongoose.isValidObjectId(filter);
    const finalFilter = isId ? { _id: filter } : filter;

    const { set, unset } = this.getSetAndUnsetFields(updateFields);

    return await this.model
      .findOneAndUpdate(
        finalFilter,
        { $set: set, $unset: unset },
        {
          new: returning,
          runValidators
        }
      )
      .exec();
  }

  async updateMany(
    filter: Partial<T>,
    updateFields: Partial<T>,
    options: {
      runValidators?: boolean;
    } = {}
  ) {
    const { runValidators = true } = options;

    const { set, unset } = this.getSetAndUnsetFields(updateFields);

    return await this.model
      .updateMany(filter, { $set: set, $unset: unset }, { runValidators })
      .exec();
  }

  async deleteOne(filter: Partial<Fields<T>> | string | mongoose.Types.ObjectId) {
    const isId = typeof filter === "string" || mongoose.isValidObjectId(filter);
    const finalFilter = isId ? { _id: filter } : filter;

    return await this.model.deleteOne(finalFilter).exec();
  }

  async deleteMany(filter: Partial<T> = {}, options: QueryFilterOptions<T> = {}) {
    let query = this.model.deleteMany(filter);
    query = this.applyQueryOptions(query, { filters: options });
    return await query.exec();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyQueryOptions<Q extends mongoose.Query<any, any>>(
    query: Q,
    options?: RepositoryQueryOptions<T>
  ): Q {
    if (!options) return query;

    const { select, include, exclude, populate, limit, skip, sort, filters } = options;

    // Handle select/exclude
    if (select && exclude) {
      throw new Error("Cannot use both `select` and `exclude` at the same time.");
    }

    if (select) {
      const selectStr = Array.isArray(select) ? select.join(" ") : select;
      query.select(selectStr);
    } else if (exclude) {
      const excludeStr = Array.isArray(exclude)
        ? exclude.map((field) => `-${field}`).join(" ")
        : `-${exclude}`;
      query.select(excludeStr);
    }

    if (include) {
      const includeArray = Array.isArray(include) ? include : [include];
      const includeStr = includeArray
      .map((field) => `+${field}`)
      .join(" ");
      query.select(includeStr);
    }

    // Handle populate
    if (populate) {
      const pops = Array.isArray(populate) ? populate : [populate];
      for (const pop of pops) {
        if (typeof pop === "string") {
          query.populate(pop);
        } else if (typeof pop === "object" && "path" in pop) {
          query.populate({
            path: pop.path,
            select: Array.isArray(pop.select) ? pop.select.join(" ") : pop.select
          });
        }
      }
    }

    // Pagination
    if (limit !== undefined) {
      query.limit(limit);
    }

    if (skip !== undefined) {
      query.skip(skip);
    }

    // Sorting
    if (sort) {
      query.sort(this.normalizeSort(sort));
    }

    //Not equal
    if (filters?.isNot) {
      Object.entries(filters.isNot).forEach(([key, value]) => {
        query.where(key).ne(value);
      });
    }

    if (filters?.in) {
      Object.entries(filters.in).forEach(([key, values]) => {
        if (values) query.where(key).in(values);
      });
    }

    return query;
  }

  private getSetAndUnsetFields(updateFields: Partial<T>) {
    const set: Partial<T> = {};
    const unset: Partial<Record<keyof T, number>> = {};

    Object.keys(updateFields).forEach((field) => {
      const key = field as keyof T;
      if (updateFields[key] === undefined) {
        unset[key] = 1;
      } else {
        set[key] = updateFields[key];
      }
    });

    return { set, unset };
  }

  protected normalizeSort(sort: RepositoryQueryOptions<T>["sort"]) {
    const normalizedSort: Record<string, 1 | -1> = {};
    if (sort) {
      for (const [field, direction] of Object.entries(sort)) {
        normalizedSort[field] = direction === "ASC" || direction === 1 ? 1 : -1;
      }
    }
    return normalizedSort;
  }
}
