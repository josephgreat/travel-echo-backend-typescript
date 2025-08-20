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
exports.PostMediaModel = exports.PostMedia = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("./user.model");
const comment_model_1 = require("./comment.model");
const models_1 = require("./models");
let PostMedia = class PostMedia extends models_1.CloudinaryImage {
};
exports.PostMedia = PostMedia;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: () => user_model_1.User }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], PostMedia.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: "Post" }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], PostMedia.prototype, "post", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: () => comment_model_1.Comment }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], PostMedia.prototype, "comment", void 0);
exports.PostMedia = PostMedia = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], PostMedia);
exports.PostMediaModel = (0, typegoose_1.getModelForClass)(PostMedia);
