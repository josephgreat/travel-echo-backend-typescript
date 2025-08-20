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
exports.Repository = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("#src/utils/constants");
const helpers_1 = require("#src/utils/helpers");
class Repository {
    constructor(model) {
        this.model = model;
    }
    raw() {
        return this.model;
    }
    async findOne(fields, options) {
        let query = this.model.findOne(fields);
        query = this.applyQueryOptions(query, options);
        return await query.lean();
    }
    async findMany(fields, options) {
        let query = this.model.find(fields);
        query = this.applyQueryOptions(query, options);
        return await query.lean();
    }
    async findOneWithParsedRequestQuery(req, fields = {}) {
        const { populate, select, where } = req.parsedQuery || {};
        const filter = { ...fields };
        if (where) {
            const validKeys = Array.from(new Set(["_id", ...Object.keys(this.model.schema.paths)]));
            for (const key of Object.keys(where)) {
                if (validKeys.includes(key)) {
                    const typedKey = key;
                    // @ts-expect-error (unknown value of where[typedKey])
                    filter[typedKey] = where[typedKey];
                }
            }
        }
        return this.findOne(filter, { populate, select });
    }
    async findManyWithParsedRequestQuery(fields = {}, req, keys) {
        const parsed = req.parsedQuery || {};
        // Helper function to resolve value from keys override
        const resolveKey = (key) => {
            const override = keys?.[key];
            if (override === true) {
                return parsed[key];
            }
            if (override && typeof override === "object" && "value" in override) {
                return override.value;
            }
            if (override) {
                return override;
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
                    filter[key] = where[key];
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
    async findById(id, options) {
        if (!(0, mongoose_1.isObjectIdOrHexString)(id)) {
            throw new Error("Invalid ID provided");
        }
        let query = this.model.findById(id);
        query = this.applyQueryOptions(query, options);
        return await query.lean();
    }
    async findOrCreate(fields, data, options) {
        const doc = await this.findOne(fields, options);
        if (!doc) {
            return await this.create(data);
        }
        return doc;
    }
    async create(fields) {
        return (await this.model.create(fields)).toObject();
    }
    async createUnique(indexes, fields) {
        const normalizedIndexes = Object.fromEntries(Object.entries(indexes).map(([key, value]) => {
            if (typeof value === "object" && value !== null && "value" in value) {
                return [key, value.value];
            }
            return [key, value];
        }));
        const forceUniqueFields = Object.entries(indexes)
            .map(([key, value]) => {
            if (typeof value === "object" &&
                value !== null &&
                "forceUnique" in value &&
                value.forceUnique) {
                return key;
            }
        })
            .filter((key) => key !== undefined);
        const item = await this.model.findOne(normalizedIndexes).lean();
        if (!item) {
            return (await this.model.create(fields)).toObject();
        }
        if (!forceUniqueFields.length) {
            const error = new Error("One or more duplicate fields found");
            error.name = "DUPLICATE_FIELD_ERROR";
            throw error;
        }
        const retries = constants_1.UNIQUE_VALUE_GENERATION_RETRIES;
        const updatedFields = { ...fields };
        const updatedIndexes = { ...normalizedIndexes };
        const uniqueFieldPromises = forceUniqueFields.map(async (field) => {
            const value = updatedIndexes[field];
            if (value && typeof value === "string") {
                for (let attempt = 0; attempt < retries; attempt++) {
                    const uniqueValue = this.generateUniqueValue(value, attempt);
                    updatedIndexes[field] = uniqueValue;
                    const existingItem = await this.model.findOne(updatedIndexes);
                    if (!existingItem) {
                        return { field, value: uniqueValue };
                    }
                }
                const error = new Error(`Could not generate unique value for field ${String(field)} after ${retries} attempts`);
                error.name = "MAX_UNIQUE_VALUE_GENERATION_ERROR";
                throw error;
            }
            return { field, value };
        });
        const uniqueFields = await Promise.all(uniqueFieldPromises);
        uniqueFields.forEach(({ field, value }) => {
            if (value !== undefined) {
                updatedFields[field] = value;
            }
        });
        return (await this.model.create(updatedFields)).toObject();
    }
    async upsert(filter, updateFields, createFields, options = {}) {
        const { returning = false, runValidators = true } = options;
        const { set, unset } = this.getSetAndUnsetFields(updateFields);
        let doc = await this.model.findOneAndUpdate(filter, { $set: set, $unset: unset }, { new: returning, runValidators });
        if (!doc) {
            doc = await this.model.create(createFields);
        }
        return returning ? doc?.toObject() : undefined;
    }
    /* async upsert(
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
    } */
    async insertMany(docs, options = {}) {
        return await this.model.insertMany(docs, {
            ordered: options.ordered ?? true,
            rawResult: options.rawResult ?? false
        });
    }
    async updateOne(filter, updateFields, options = {}) {
        const { returning = false, runValidators = true } = options;
        const isId = typeof filter === "string" || mongoose_1.default.isValidObjectId(filter);
        const finalFilter = isId ? { _id: filter } : filter;
        const { set, unset } = this.getSetAndUnsetFields(updateFields);
        return await this.model
            .findOneAndUpdate(finalFilter, { $set: set, $unset: unset }, {
            new: returning,
            runValidators
        })
            .exec();
    }
    async updateUnique(indexes, filter, fields, options = {}) {
        const { returning = true, runValidators = false } = options;
        const { _id, ...indexesWithoutId } = indexes;
        const normalizedIndexes = Object.fromEntries(Object.entries(indexesWithoutId).map(([key, value]) => {
            if (typeof value === "object" && value !== null && "value" in value) {
                return [key, value.value];
            }
            return [key, value];
        }));
        const forceUniqueFields = Object.entries(indexesWithoutId)
            .map(([key, value]) => {
            if (typeof value === "object" &&
                value !== null &&
                "forceUnique" in value &&
                value.forceUnique) {
                return key;
            }
        })
            .filter((key) => key !== undefined);
        if (!_id)
            throw new Error("_id must be provided");
        const objectId = typeof _id === "string" ? (0, helpers_1.castToObjectId)(_id) : _id;
        const parsedIndexes = { _id: { $ne: objectId }, ...normalizedIndexes };
        const item = await this.model.findOne(parsedIndexes);
        if (!item) {
            const { set, unset } = this.getSetAndUnsetFields(fields);
            return await this.model
                .findOneAndUpdate(filter, { $set: set, $unset: unset }, {
                new: returning,
                runValidators
            })
                .exec();
        }
        if (!forceUniqueFields.length) {
            const error = new Error("One or more duplicate fields found");
            error.name = "DUPLICATE_FIELD_ERROR";
            throw error;
        }
        const retries = constants_1.UNIQUE_VALUE_GENERATION_RETRIES;
        const updatedFields = { ...fields };
        const updatedIndexes = { ...parsedIndexes };
        const uniqueFieldPromises = forceUniqueFields.map(async (field) => {
            //@ts-expect-error dynamic key check
            const value = updatedIndexes[field];
            if (value && typeof value === "string") {
                for (let attempt = 0; attempt < retries; attempt++) {
                    const uniqueValue = this.generateUniqueValue(value, attempt);
                    //@ts-expect-error dynamic key check
                    updatedIndexes[field] = uniqueValue;
                    const existingItem = await this.model.findOne(updatedIndexes);
                    if (!existingItem) {
                        return { field, value: uniqueValue };
                    }
                }
                const error = new Error(`Could not generate unique value for field ${String(field)} after ${retries} attempts`);
                error.name = "MAX_UNIQUE_VALUE_GENERATION_ERROR";
                throw error;
            }
            return { field, value };
        });
        const uniqueFields = await Promise.all(uniqueFieldPromises);
        uniqueFields.forEach(({ field, value }) => {
            if (value !== undefined) {
                //@ts-expect-error dynamic key check
                updatedFields[field] = value;
            }
        });
        const { set, unset } = this.getSetAndUnsetFields(updatedFields);
        return await this.model
            .findOneAndUpdate(filter, { $set: set, $unset: unset }, {
            new: returning,
            runValidators
        })
            .exec();
    }
    async updateMany(filter, updateFields, options = {}) {
        const { runValidators = true } = options;
        const { set, unset } = this.getSetAndUnsetFields(updateFields);
        return await this.model
            .updateMany(filter, { $set: set, $unset: unset }, { runValidators })
            .exec();
    }
    async deleteOne(filter) {
        const isId = typeof filter === "string" || mongoose_1.default.isValidObjectId(filter);
        const finalFilter = isId ? { _id: filter } : filter;
        return await this.model.deleteOne(finalFilter).exec();
    }
    async deleteMany(filter = {}, options = {}) {
        let query = this.model.deleteMany(filter);
        query = this.applyQueryOptions(query, { filters: options });
        return await query.exec();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyQueryOptions(query, options) {
        if (!options)
            return query;
        const { where, select, include, exclude, populate, limit, skip, sort, filters } = options;
        if (where) {
            query.where(where);
        }
        // Handle select/exclude
        if (select && exclude) {
            throw new Error("Cannot use both `select` and `exclude` at the same time.");
        }
        if (select) {
            const selectStr = Array.isArray(select) ? select.join(" ") : select;
            query.select(selectStr);
        }
        else if (exclude) {
            const excludeStr = Array.isArray(exclude)
                ? exclude.map((field) => `-${field}`).join(" ")
                : `-${exclude}`;
            query.select(excludeStr);
        }
        if (include) {
            const includeArray = Array.isArray(include) ? include : [include];
            const includeStr = includeArray.map((field) => `+${field}`).join(" ");
            query.select(includeStr);
        }
        // Handle populate
        if (populate) {
            const pops = Array.isArray(populate) ? populate : [populate];
            for (const pop of pops) {
                if (typeof pop === "string") {
                    query.populate(pop);
                }
                else if (typeof pop === "object" && "path" in pop) {
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
                if (values)
                    query.where(key).in(values);
            });
        }
        return query;
    }
    getSetAndUnsetFields(updateFields) {
        const set = {};
        const unset = {};
        Object.keys(updateFields).forEach((field) => {
            const key = field;
            if (updateFields[key] === null) {
                unset[key] = 1;
            }
            else {
                set[key] = updateFields[key];
            }
        });
        return { set, unset };
    }
    normalizeSort(sort) {
        const normalizedSort = {};
        if (sort) {
            for (const [field, direction] of Object.entries(sort)) {
                normalizedSort[field] = direction === "ASC" || direction === 1 ? 1 : -1;
            }
        }
        return normalizedSort;
    }
    generateUniqueValue(originalValue, attempt) {
        return `${originalValue}(${attempt + 1})`;
        /* if (attempt === 0) {
          return `${originalValue}_${Date.now()}`;
        }
        return `${originalValue}_${Date.now()}_${attempt}`; */
    }
}
exports.Repository = Repository;
