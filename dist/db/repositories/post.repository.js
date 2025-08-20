"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRepository = exports.PostRepository = void 0;
const post_model_1 = require("../models/post.model");
const repository_1 = require("./repository");
class PostRepository extends repository_1.Repository {
    constructor() {
        super(post_model_1.PostModel);
    }
}
exports.PostRepository = PostRepository;
exports.postRepository = new PostRepository();
