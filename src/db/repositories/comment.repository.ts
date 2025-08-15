import { Comment, CommentModel } from "../models/comment.model";
import { Repository } from "./repository";

export class CommentRepository extends Repository<Comment> {
  constructor() {
    super(CommentModel);
  }

}

export const commentRepository = new CommentRepository();
