const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const { storage } = require('./storage');

/**
 * Setup authentication middleware
 * @param {Express} app Express application
 */
async function setupAuth(app) {
  // Session settings with secure cookie in production
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  // Set trust proxy for secure cookies behind reverse proxy
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Use session middleware
  app.use(session(sessionSettings));

  // Device tracking middleware
  app.use((req, res, next) => {
    // Check for device ID in cookies or headers
    let deviceId = req.cookies.deviceId || req.headers['x-device-id'];
    
    if (!deviceId) {
      // Create a new device ID if none exists
      deviceId = crypto.randomBytes(16).toString('hex');
      res.cookie('deviceId', deviceId, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
      });
    }
    
    // Add device ID to request for use in routes
    req.deviceId = deviceId;
    next();
  });

  // Log all authentication attempts
  app.use((req, res, next) => {
    // Skip logging for static assets and non-auth routes
    if (req.path.startsWith('/api/auth') || req.path === '/api/login' || req.path === '/api/logout') {
      console.log(`Auth attempt: ${req.method} ${req.path} | IP: ${req.ip} | Device: ${req.deviceId || 'unknown'}`);
    }
    next();
  });
}

/**
 * Middleware to check if the user is authenticated
 */
function isAuthenticated(req, res, next) {
  // For now, we'll simulate authentication
  // In production, this would check the session or token
  // and validate against the database
  
  // Set a mock user for development
  if (process.env.NODE_ENV !== 'production') {
    req.user = {
      id: 1,
      username: 'devuser',
      email: 'dev@example.com'
    };
    return next();
  }
  
  // Check if user is authenticated
  if (req.session && req.session.userId) {
    return next();
  }
  
  // User is not authenticated
  return res.status(401).json({ message: 'Unauthorized. Please log in.' });
}

/**
 * Middleware to ensure the request is coming from a valid, registered device
 */
function ensureValidDevice(req, res, next) {
  // Get device ID from request (set by earlier middleware)
  const deviceId = req.deviceId || req.headers['x-device-id'] || req.cookies.deviceId;
  
  if (!deviceId) {
    return res.status(403).json({
      message: 'Device identification required',
      error: 'Your device cannot be identified. Please enable cookies and try again.'
    });
  }
  
  // In production, verify the device is registered to this user
  // For now, we'll allow any device with a valid ID
  next();
}

module.exports = {
  setupAuth,
  isAuthenticated,
  ensureValidDevice
};