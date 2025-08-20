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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryImage = void 0;
const typegoose_1 = require("@typegoose/typegoose");
class CloudinaryImage {
}
exports.CloudinaryImage = CloudinaryImage;
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], CloudinaryImage.prototype, "url", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], CloudinaryImage.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], CloudinaryImage.prototype, "publicId", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], CloudinaryImage.prototype, "assetId", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], CloudinaryImage.prototype, "format", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Number)
], CloudinaryImage.prototype, "bytes", void 0);
