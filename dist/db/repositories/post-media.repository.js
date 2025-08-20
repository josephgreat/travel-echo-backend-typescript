"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postMediaRepository = exports.PostMediaRepository = void 0;
const post_media_model_1 = require("../models/post-media.model");
const repository_1 = require("./repository");
class PostMediaRepository extends repository_1.Repository {
    constructor() {
        super(post_media_model_1.PostMediaModel);
    }
}
exports.PostMediaRepository = PostMediaRepository;
exports.postMediaRepository = new PostMediaRepository();
