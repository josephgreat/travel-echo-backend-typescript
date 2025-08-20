"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const memory_repository_1 = require("#src/db/repositories/memory.repository");
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const constants_1 = require("#src/utils/constants");
const parse_search_queries_1 = __importDefault(require("./services/parse-search-queries"));
exports.default = (0, api_1.defineApi)({ group: "/users/me", path: "/memories", method: "get" }, (0, handlers_1.defineHandler)(async (req) => {
    const { id } = req.user;
    const { search, title, description, location, tag } = (0, parse_search_queries_1.default)(req);
    const { where, sort, select, limit = constants_1.GET_REQUEST_DATA_LIMIT, skip = 0 } = req.parsedQuery || {};
    const memories = await memory_repository_1.memoryRepository.findMemoryByUserId(id, {
        where,
        sort,
        select,
        limit,
        skip,
        search,
        title,
        description,
        location,
        tag
    });
    return { memories };
}));
/**
 * @api {get} /users/me/memories
 * @desc Gets the memories of the user with 5 memory images each
 * @domain {User: Memories}
 * @use {Auth}
 * @res {json}
 * {
 *   "success": true,
 *   "memories": [
 *      {
 *       "_id": "64e5a320c41e2f5e8e1c29a8",
 *       "title": "Hike to Mount Fuji",
 *       "description": "description of memory",
 *       "location": "Tokyo, Japan",
 *       "date": "2023-01-01T11:24:52.000Z",
 *       "tags": ["hiking", "nature"],
 *       "isPublic": true,
 *       "createdAt": "2023-01-01T00:00:00.000Z",
 *       "updatedAt": "2023-01-01T00:00:00.000Z",
 *       "images": [
 *         {
 *           "_id": "60e8cba1f1d73c004d6e9f01",
 *           "user": "64e5a2bac41e2f5e8e1c29a2",
 *           "memory": "64e5a2cbc41e2f5e8e1c29a3",
 *           "url": "https://example.com/image.jpg",
 *           "name": "IMG-MEM-1704067200000",
 *           "format": "jpg",
 *           "bytes": 123456,
 *           "publicId": "IMG-MEM-1704067200000",
 *           "assetId": "63545234234344",
 *           "createdAt": "2023-01-01T00:00:00.000Z",
 *           "updatedAt": "2023-01-01T00:00:00.000Z"
 *         }
 *       ]
 *     }
 *   ]
 * }
 * @par {search?} @query Searches for memories by title, location, or tag e.g search=<value>
 * @par {title?} @query Specific search by title e.g title=<value>
 * @par {location?} @query Specific search by location e.g location=<value>
 * @par {tag?} @query Specific search by tag e.g tag=<value>
 * @par {description?} @query Specific search by description e.g description=<value>
 * @use {Query}
 */
