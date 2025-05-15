import { userRepository } from "#src/db/repositories/user.repository";
import env from "#src/utils/env";
import { pick, signJWT } from "#src/utils/helpers";
import passport from "passport";
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { JWT_LOGIN_SESSION_DURATION } from "#src/utils/constants";
import { AuthUser } from "#src/types/user";

const JWT_SECRET = env.get("JWT_SECRET", "jwt-secret");
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

export interface JWTPayload {
  userId: string;
  email: string;
}

passport.use(
  new JWTStrategy(jwtOptions, async (payload: JWTPayload, done) => {
    try {
      const user = await userRepository.findById(payload.userId);
      if (!user) {
        return done(null, false, { message: "User not found" });
      }
      const authUser: AuthUser = {
        id: user._id,
        ...pick(user, ["name", "email", "verified", "role", "plan", "profile"])
      };
      return done(null, authUser);
    } catch (error) {
      return done(error, false, { message: "Authentication error" });
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: env.get("GOOGLE_CLIENT_ID"),
      clientSecret: env.get("GOOGLE_CLIENT_SECRET"),
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await userRepository.findOrCreate(
          { googleId: profile.id },
          {
            name: profile.displayName,
            email: profile.emails?.[0].value,
            verified: profile.emails?.[0].verified,
            googleId: profile.id
          }
        );
        const token = signJWT<JWTPayload>(
          { userId: user._id.toString(), email: user.email },
          { expiresIn: JWT_LOGIN_SESSION_DURATION }
        );
        return done(null, {
          id: user._id,
          name: user.name,
          email: user.email,
          verified: user.verified,
          role: user.role,
          plan: user.plan,
          profile: user.profile,
          token
        });
      } catch (error) {
        return done(error, false, { message: "Authentication error" });
      }
    }
  )
);

export default passport;
