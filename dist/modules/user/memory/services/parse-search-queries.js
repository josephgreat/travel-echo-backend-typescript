"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parseSearchQueries;
function parseSearchQueries(req) {
    const fields = ["search", "title", "description", "location", "tag"];
    const queries = {};
    fields.forEach((key) => {
        queries[key] = parseSingleQuery(req.query[key]);
    });
    return queries;
}
function parseSingleQuery(query) {
    if (!query)
        return "";
    const parsedQuery = Array.isArray(query) ? query.join(" ").trim() : query.toString().trim();
    return parsedQuery;
}
