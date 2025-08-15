import { Post, PostModel } from "../models/post.model";
import { Repository } from "./repository";

export class PostRepository extends Repository<Post> {
  constructor() {
    super(PostModel);
  }

}

export const postRepository = new PostRepository();

