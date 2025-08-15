import { Like, LikeModel } from "../models/like.model";
import { Repository } from "./repository";

export class LikeRepository extends Repository<Like> {
  constructor() {
    super(LikeModel);
  }

}

export const likeRepository = new LikeRepository();
