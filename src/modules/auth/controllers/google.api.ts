import { defineApi } from "#src/lib/api/api";
import passport from "#src/config/passport.config";
import { defineHandler } from "#src/lib/api/handlers";
import { HttpResponse } from "#src/lib/api/http";

export const signInWithGoogle = defineApi(
  { group: "/google", path: "", method: "get" },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

export const googleAuthCallback = defineApi(
  { group: "/google", path: "/callback", method: "get" },
  passport.authenticate("google", { session: false }),
  defineHandler(() => {
    return HttpResponse.success("Login with Google successful");
  })
);
