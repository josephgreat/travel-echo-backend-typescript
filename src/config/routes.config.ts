import { UserRole } from "#src/db/models/user.model";
import { GenerateRoutesOptions } from "#src/lib/api/router";
import auth from "#src/middleware/auth";

export const routeConfig: GenerateRoutesOptions = {
  globalPrefix: "/api/v1",
  groupMiddleware: {
    "/users/me": auth(UserRole.User),
    "/community": auth([UserRole.Admin, UserRole.User]),
  }
};
