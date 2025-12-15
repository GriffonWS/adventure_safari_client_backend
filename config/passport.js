const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AppleStrategy = require("passport-apple").Strategy;
const User = require("../models/User");

module.exports = (passport) => {
  // Debug: Log environment variables
  console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
  console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "***" : "NOT SET");
  console.log("GOOGLE_CALLBACK_URL:", process.env.GOOGLE_CALLBACK_URL);
  console.log("APPLE_CLIENT_ID:", process.env.APPLE_CLIENT_ID);
  console.log("APPLE_TEAM_ID:", process.env.APPLE_TEAM_ID);
  console.log("APPLE_KEY_ID:", process.env.APPLE_KEY_ID);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("ERROR: Google OAuth credentials not found in environment variables!");
    console.error("Please ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env file");
    throw new Error("Missing Google OAuth credentials");
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // 1. Check for existing Google user
          let user = await User.findOneAndUpdate(
            { googleId: profile.id },
            { $set: { lastLogin: new Date() } },
            { new: true }
          );

          if (user) return done(null, user);

          // 2. Check for existing email user
          const email = profile.emails[0].value;
          user = await User.findOneAndUpdate(
            { email },
            {
              $set: {
                googleId: profile.id,
                lastLogin: new Date(),
                isVerified: true // Auto-verify email for Google users
              }
            },
            { new: true }
          );

          if (user) {
            return done(null, user);
          }

          // 3. Create new Google user
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email,
            isVerified: true,
            lastLogin: new Date()
          });

          return done(null, user);

        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );

  // Apple OAuth Strategy
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY_PATH) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
          callbackURL: process.env.APPLE_CALLBACK_URL,
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, idToken, profile, done) => {
          try {
            // Apple provides minimal profile data
            const appleId = profile.id;
            const email = profile.email;
            const name = profile.name ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim() : email.split('@')[0];

            // 1. Check for existing Apple user
            let user = await User.findOneAndUpdate(
              { appleId: appleId },
              { $set: { lastLogin: new Date() } },
              { new: true }
            );

            if (user) return done(null, user);

            // 2. Check for existing email user (if email provided)
            if (email) {
              user = await User.findOneAndUpdate(
                { email },
                {
                  $set: {
                    appleId: appleId,
                    lastLogin: new Date(),
                    isVerified: true // Auto-verify email for Apple users
                  }
                },
                { new: true }
              );

              if (user) {
                return done(null, user);
              }
            }

            // 3. Create new Apple user
            user = await User.create({
              appleId: appleId,
              name: name,
              email: email || `apple_${appleId}@adventuresafari.temp`,
              isVerified: true,
              lastLogin: new Date()
            });

            return done(null, user);

          } catch (error) {
            console.error("Apple OAuth error:", error);
            return done(error, null);
          }
        }
      )
    );
  } else {
    console.log("Apple OAuth not configured - skipping Apple strategy");
  }

  // Session serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
