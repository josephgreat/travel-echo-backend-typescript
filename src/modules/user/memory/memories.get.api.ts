import { memoryRepository } from "#src/db/repositories/memory.repository";
import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { GET_REQUEST_DATA_LIMIT } from "#src/utils/constants";
import parseSearchQueries from "./services/parse-search-queries";

export default defineApi(
  { group: "/users/me", path: "/memories", method: "get" },
  defineHandler(async (req) => {
    const { id } = req.user!;

    const { search, title, description, location, tag } = parseSearchQueries(req);

    const { where, sort, select, limit = GET_REQUEST_DATA_LIMIT, skip = 0 } = req.parsedQuery || {};

    const memories = await memoryRepository.findMemoryByUserId(id, {
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
  })
);

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
