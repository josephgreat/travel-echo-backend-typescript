"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = require("#src/db/repositories/user.repository");
const env_1 = __importDefault(require("#src/utils/env"));
const helpers_1 = require("#src/utils/helpers");
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = require("passport-jwt");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const constants_1 = require("#src/utils/constants");
const JWT_SECRET = env_1.default.get("JWT_SECRET", "jwt-secret");
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
};
passport_1.default.use(new passport_jwt_1.Strategy(jwtOptions, async (payload, done) => {
    try {
        const user = await user_repository_1.userRepository.findById(payload.userId);
        if (!user) {
            return done(null, false, { message: "User not found" });
        }
        const authUser = {
            id: user._id,
            ...(0, helpers_1.pick)(user, ["name", "email", "verified", "role", "plan", "profile"])
        };
        return done(null, authUser);
    }
    catch (error) {
        return done(error, false, { message: "Authentication error" });
    }
}));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.default.get("GOOGLE_CLIENT_ID"),
    clientSecret: env_1.default.get("GOOGLE_CLIENT_SECRET"),
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = await user_repository_1.userRepository.findOrCreate({ googleId: profile.id }, {
            name: profile.displayName,
            email: profile.emails?.[0].value,
            verified: profile.emails?.[0].verified,
            googleId: profile.id
        });
        const token = (0, helpers_1.signJWT)({ userId: user._id.toString(), email: user.email }, { expiresIn: constants_1.JWT_LOGIN_SESSION_DURATION });
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
    }
    catch (error) {
        return done(error, false, { message: "Authentication error" });
    }
}));
exports.default = passport_1.default;
