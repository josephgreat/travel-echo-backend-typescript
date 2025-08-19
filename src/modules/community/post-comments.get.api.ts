import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";

export default defineApi(
  {
    group: "/community",
    path: "/posts/:post_id/comments",
    method: "get"
  },
  defineHandler(async (req) => {
    const postId = req.params.post_id;
  })
);
