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
exports.postSchema = exports.PostModel = exports.Post = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("./user.model");
const post_media_model_1 = require("./post-media.model");
const zod_1 = require("zod");
const helpers_1 = require("#src/utils/helpers");
const constants_1 = require("#src/utils/constants");
let Post = class Post {
};
exports.Post = Post;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: () => user_model_1.User }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Post.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({
        ref: () => post_media_model_1.PostMedia,
        type: () => [mongoose_1.default.Types.ObjectId],
        default: []
    }),
    __metadata("design:type", Array)
], Post.prototype, "media", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: () => Post }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Post.prototype, "repostedPost", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: false }),
    __metadata("design:type", String)
], Post.prototype, "content", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [String], default: [] }),
    __metadata("design:type", Array)
], Post.prototype, "tags", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: true }),
    __metadata("design:type", Boolean)
], Post.prototype, "isPublic", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Post.prototype, "likeCount", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Post.prototype, "commentCount", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Post.prototype, "repostCount", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: false, required: true }),
    __metadata("design:type", Boolean)
], Post.prototype, "isEdited", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: false }),
    __metadata("design:type", Boolean)
], Post.prototype, "isReposting", void 0);
exports.Post = Post = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Post);
// Computed fields
// isLikedByViewer boolean;
// isBookmarkedByViewer boolean;
exports.PostModel = (0, typegoose_1.getModelForClass)(Post);
exports.postSchema = zod_1.z.object({
    /*   user: z
      .string({ message: "User ID is required" })
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "User ID must be a valid MongoDB ObjectId"
      })
      .transform((val) => castToObjectId(val))
      .optional(), */
    repostedPost: zod_1.z
        .string()
        .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Reposted post ID must be a valid MongoDB ObjectId"
    })
        .transform((val) => (0, helpers_1.castToObjectId)(val))
        .optional(),
    content: zod_1.z
        .string({ message: "Content must be a string" })
        .max(constants_1.MAX_POST_CONTENT_LENGTH, {
        message: `Content must not exceed ${constants_1.MAX_POST_CONTENT_LENGTH} characters`
    })
        .optional(),
    tags: zod_1.z
        .array(zod_1.z
        .string({ message: "Tag must be a string" })
        .min(1, { message: "Tag cannot be empty" }))
        .default([]),
    isPublic: zod_1.z.coerce
        .boolean({ message: "isPublic must be true or false" })
        .default(true)
        .optional()
});
