import { Token, TokenModel } from "../models/token.model";
import { Repository } from "./repository";

export class TokenRepository extends Repository<Token> {
  constructor() {
    super(TokenModel);
  }
}

export const tokenRepository = new TokenRepository();
