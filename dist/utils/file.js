"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFileStream = saveFileStream;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
async function saveFileStream(file, dir, filename) {
    return new Promise((resolve, reject) => {
        if (!(0, node_fs_1.existsSync)(dir)) {
            (0, node_fs_1.mkdirSync)(dir, { recursive: true });
        }
        const filepath = node_path_1.default.join(dir, filename);
        const stream = (0, node_fs_1.createWriteStream)(filepath);
        stream.on("finish", () => resolve(filepath));
        stream.on("error", (err) => {
            console.error(err);
            reject(err);
        });
        file.pipe(stream);
    });
}
