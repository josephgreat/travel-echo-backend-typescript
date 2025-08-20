"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRepository = exports.CommentRepository = void 0;
const comment_model_1 = require("../models/comment.model");
const repository_1 = require("./repository");
class CommentRepository extends repository_1.Repository {
    constructor() {
        super(comment_model_1.CommentModel);
    }
}
exports.CommentRepository = CommentRepository;
exports.commentRepository = new CommentRepository();
