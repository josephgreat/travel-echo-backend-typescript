"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenRepository = exports.TokenRepository = void 0;
const token_model_1 = require("../models/token.model");
const repository_1 = require("./repository");
class TokenRepository extends repository_1.Repository {
    constructor() {
        super(token_model_1.TokenModel);
    }
}
exports.TokenRepository = TokenRepository;
exports.tokenRepository = new TokenRepository();
