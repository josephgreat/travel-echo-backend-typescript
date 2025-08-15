import { defineApi } from "#src/lib/api/api";
import { defineHandler } from "#src/lib/api/handlers";
import { Formstream } from "#src/utils/formstream";

export default defineApi(
  {
    path: "/upload",
    method: "post"
  },
  defineHandler(async (req) => {
    console.log("In upload");
    const { execute } = new Formstream({ headers: req.headers });

    const res = await execute(req, async ({ file }) => {
      return String(file);
    });

    console.log(res.data?.fields);

    console.log(res.data?.files);

    return {
      success: true,
      message: "Upload successfull"
    };
  })
);
