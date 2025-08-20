"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentSchema = exports.CommentModel = exports.Comment = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("./user.model");
const zod_1 = require("zod");
const helpers_1 = require("#src/utils/helpers");
const constants_1 = require("#src/utils/constants");
let Comment = class Comment {
};
exports.Comment = Comment;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: () => user_model_1.User }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Comment.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: "Post" }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Comment.prototype, "post", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: () => Comment }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Comment.prototype, "parentComment", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: false }),
    __metadata("design:type", String)
], Comment.prototype, "content", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Comment.prototype, "likeCount", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Comment.prototype, "replyCount", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Comment.prototype, "reportedCount", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: false, required: true }),
    __metadata("design:type", Boolean)
], Comment.prototype, "isEdited", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: false }),
    __metadata("design:type", Boolean)
], Comment.prototype, "isReplying", void 0);
exports.Comment = Comment = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Comment);
exports.CommentModel = (0, typegoose_1.getModelForClass)(Comment);
exports.commentSchema = zod_1.z.object({
    /*   user: z
      .string({ message: "User ID is required" })
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "User ID must be a valid MongoDB ObjectId"
      })
      .transform((val) => castToObjectId(val)), */
    /*   post: z
      .string({ message: "Post ID is required" })
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Post ID must be a valid MongoDB ObjectId"
      })
      .transform((val) => castToObjectId(val)), */
    parentComment: zod_1.z
        .string()
        .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Parent comment ID must be a valid MongoDB ObjectId"
    })
        .transform((val) => (0, helpers_1.castToObjectId)(val))
        .optional(),
    content: zod_1.z
        .string({ message: "Content must be a string" })
        .max(constants_1.MAX_COMMENT_CONTENT_LENGTH, {
        message: `Content must not exceed ${constants_1.MAX_COMMENT_CONTENT_LENGTH} characters`
    })
});
