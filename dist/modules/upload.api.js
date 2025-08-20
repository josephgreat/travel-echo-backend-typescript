"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("#src/lib/api/api");
const handlers_1 = require("#src/lib/api/handlers");
const formstream_1 = require("#src/utils/formstream");
exports.default = (0, api_1.defineApi)({
    path: "/upload",
    method: "post"
}, (0, handlers_1.defineHandler)(async (req) => {
    console.log("In upload");
    const { execute } = new formstream_1.Formstream({ headers: req.headers });
    const res = await execute(req, async ({ file }) => {
        return String(file);
    });
    console.log(res.error?.message);
    console.log(res.data?.fields);
    console.log(res.data?.files);
    return {
        success: true,
        message: "Upload successfull"
    };
}));
