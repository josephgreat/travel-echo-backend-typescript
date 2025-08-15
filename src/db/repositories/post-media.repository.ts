import { PostMedia, PostMediaModel } from "../models/post-media.model";
import { Repository } from "./repository";

export class PostMediaRepository extends Repository<PostMedia> {
  constructor() {
    super(PostMediaModel);
  }

}

export const postMediaRepository = new PostMediaRepository();

