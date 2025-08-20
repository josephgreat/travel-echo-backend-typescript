"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = logger;
function logger(req, res, next) {
    if (process.env.NODE_ENV !== "production") {
        console.log(`${req.method} ${req.url}`);
    }
    next();
}
