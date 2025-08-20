"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeRepository = exports.LikeRepository = void 0;
const like_model_1 = require("../models/like.model");
const repository_1 = require("./repository");
class LikeRepository extends repository_1.Repository {
    constructor() {
        super(like_model_1.LikeModel);
    }
}
exports.LikeRepository = LikeRepository;
exports.likeRepository = new LikeRepository();
