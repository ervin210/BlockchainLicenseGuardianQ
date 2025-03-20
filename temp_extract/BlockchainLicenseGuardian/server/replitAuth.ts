import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

export async function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  const replId = process.env.REPL_ID!;
  const config = await client.discovery(
    new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
    replId,
  );

  // Use full domain with protocol for callback URL
  const domain = process.env.REPLIT_DOMAINS!.split(",")[0];
  const callbackURL = `https://${domain}/api/callback`;
  console.log("Configured callback URL:", callbackURL);
  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback) => {
    const claims = tokens.claims();
    if (!claims) {
      return
    }

    const userInfoResponse = await client.fetchUserInfo(config, tokens.access_token, claims.sub);

    // Here you can add your own business logic to provision a user account
    // based on the information provided by Replit
    // For example: check if user exists in your database, create if not,
    // update last login, etc.

    // Store the device information for quantum security features
    const deviceFingerprint = userInfoResponse.sub; // Using sub as a unique identifier
    
    // Check if we already have a user with this sub ID
    let existingUser = await storage.getUserByUsername(userInfoResponse.username as string);
    if (!existingUser) {
      // Create a new user
      existingUser = await storage.createUser({
        username: userInfoResponse.username as string,
        name: userInfoResponse.first_name 
          ? `${userInfoResponse.first_name} ${userInfoResponse.last_name || ''}` 
          : userInfoResponse.username as string,
        role: "user",
        password: "", // No password when using OAuth
        securitySettings: {
          blockRemoteConnections: true,
          notifyNewDevices: true,
          enforceQuantumSecurity: true,
          autoBlacklistSuspicious: true
        }
      });
    }

    // Check if this device has been used before
    const existingDevice = await storage.getUserDeviceByFingerprint(
      existingUser.id, 
      deviceFingerprint
    );

    if (!existingDevice) {
      // This is a new device, register it
      await storage.createUserDevice({
        userId: existingUser.id,
        deviceId: `device-${Date.now()}`,
        fingerprint: deviceFingerprint,
        deviceName: "Replit Auth Device",
        trustScore: 75, // Initial moderate trust score for new devices
        isBlacklisted: false,
        isCurrentDevice: true,
        metadata: {
          isRemote: false,
          connectionType: "secure",
          operatingSystem: "unknown",
          browser: "unknown",
          anomalyScore: 0
        }
      });

      // Create a security notification for the new device login
      await storage.createSecurityNotification({
        userId: existingUser.id,
        title: "New Device Login",
        message: "A new device was used to log in to your account using Replit authentication.",
        severity: "info",
        type: "new_device",
        isRead: false,
        isArchived: false,
        metadata: {
          deviceId: deviceFingerprint,
          time: new Date().toISOString()
        }
      });
    } else {
      // Update the device to mark it as current
      await storage.updateUserDevice(existingDevice.id, {
        isCurrentDevice: true,
        lastSeen: new Date()
      });
    }

    verified(null, userInfoResponse);
  };

  const strategy = new Strategy(
    {
      config,
      scope: "openid email profile",
      callbackURL,
    },
    verify,
  );
  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    console.log("Login attempt initiated");
    passport.authenticate(strategy.name)(req, res, next);
  });

  app.get(
    "/api/callback",
    (req, res, next) => {
      console.log("Callback received", req.query);
      passport.authenticate(strategy.name, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    }
  );

  app.get("/api/logout", (req, res) => {
    console.log("Logout initiated");
    req.logout(() => {
      // Fix for deprecated req.host
      const redirectUri = `${req.protocol}://${req.headers.host}`;
      console.log("Redirecting to:", redirectUri);
      
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: replId,
          post_logout_redirect_uri: redirectUri,
        }).href,
      );
    });
  });
}

/**
 * Authentication middleware that checks if the user is authenticated
 * Improved to handle session edge cases and provide better error messages
 */
export const isAuthenticated: RequestHandler = (req, res, next) => {
  // Check not only if authenticated but also if the session contains valid user data
  // This prevents edge cases where isAuthenticated() might return true but the session data is corrupted
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  
  // Enhanced error response for expired sessions with timestamp for debugging
  res.status(401).json({ 
    message: "Unauthorized", 
    code: "SESSION_EXPIRED",
    details: "Your session has expired or you need to log in again",
    timestamp: new Date().toISOString()
  });
}