"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryImageRepository = exports.MemoryImageRepository = void 0;
const memory_image_model_1 = require("../models/memory-image.model");
const repository_1 = require("./repository");
class MemoryImageRepository extends repository_1.Repository {
    constructor() {
        super(memory_image_model_1.MemoryImageModel);
    }
}
exports.MemoryImageRepository = MemoryImageRepository;
exports.memoryImageRepository = new MemoryImageRepository();
