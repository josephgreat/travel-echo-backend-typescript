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
exports.MemoryZodSchema = exports.MemoryModel = exports.Memory = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("./user.model");
const zod_1 = require("zod");
let Memory = class Memory {
};
exports.Memory = Memory;
__decorate([
    (0, typegoose_1.prop)({ required: true, ref: () => user_model_1.User }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], Memory.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Memory.prototype, "title", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Memory.prototype, "description", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Memory.prototype, "location", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], Memory.prototype, "date", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [String], default: [] }),
    __metadata("design:type", Array)
], Memory.prototype, "tags", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Memory.prototype, "isPublic", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Memory.prototype, "imageCount", void 0);
exports.Memory = Memory = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true }
    })
], Memory);
exports.MemoryModel = (0, typegoose_1.getModelForClass)(Memory);
exports.MemoryZodSchema = zod_1.z.object({
    title: zod_1.z.string({ message: "Title is required" }).min(3, { message: "Title is too short" }),
    description: zod_1.z.string({ message: "Invalid description provided" }).optional(),
    location: zod_1.z.string({ message: "Invalid location provided" }).optional(),
    date: zod_1.z
        .string({ message: "Invalid date provided" })
        .optional()
        .transform((dob) => (dob ? new Date(dob) : undefined)),
    tags: zod_1.z.array(zod_1.z.string({ message: "Invalid tag provided" })).optional(),
    isPublic: zod_1.z.boolean({ message: "Public status should be true or false" }).optional()
}, { message: "No request body provided" });
