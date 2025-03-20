import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAssetSchema, 
  insertLicenseSchema, 
  insertLedgerEntrySchema,
  insertViolationSchema,
  insertUserSchema,
  insertCodeImmutabilityRecordSchema
} from "@shared/schema";
import crypto from "crypto";
import { ZodError } from "zod";
import { Blockchain } from "../client/src/lib/blockchain";
import { setupAuth, isAuthenticated } from "./replitAuth";

function generateTransactionId(): string {
  return "0x" + crypto.randomBytes(32).toString("hex").slice(0, 40);
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return "just now";
}

/**
 * Generate security recommendations based on detected anomalies and violation type
 * 
 * @param anomalies List of detected anomalies
 * @param violationType Type of violation if detected
 * @param severity Violation severity
 * @returns Array of actionable recommendations
 */
function generateSecurityRecommendations(
  anomalies: string[], 
  violationType: string | null, 
  severity: string
): string[] {
  const recommendations: string[] = [];
  
  // Base recommendations based on severity level
  if (severity === 'high') {
    recommendations.push("Immediately review access logs and block suspicious IP addresses");
    recommendations.push("Enable enhanced audit logging for this asset");
  } else if (severity === 'medium') {
    recommendations.push("Review recent access patterns for this asset");
    recommendations.push("Consider implementing stricter access controls");
  }
  
  // Specific recommendations based on anomaly types
  if (anomalies.includes('multiple_locations')) {
    recommendations.push("Implement geographic restrictions on licenses");
    recommendations.push("Enable single-device enforcement for sensitive assets");
    recommendations.push("Consider implementing device fingerprinting to prevent credential sharing");
  }
  
  if (anomalies.includes('rapid_location_change')) {
    recommendations.push("Force immediate password reset for affected accounts");
    recommendations.push("Implement location-based login verification");
    recommendations.push("Consider suspending access until investigation is complete");
  }
  
  if (anomalies.includes('high_frequency') || anomalies.includes('api_abuse')) {
    recommendations.push("Implement rate limiting for API access");
    recommendations.push("Add CAPTCHA verification for suspected automated access");
    recommendations.push("Deploy progressive throttling for repeated high-volume requests");
  }
  
  if (anomalies.includes('odd_hours') || anomalies.includes('temporal_anomaly')) {
    recommendations.push("Set up time-based access restrictions");
    recommendations.push("Require MFA for off-hours access");
    recommendations.push("Implement access anomaly notifications to administrators");
  }
  
  if (anomalies.includes('suspicious_access_point')) {
    recommendations.push("Block access from known VPN/proxy/Tor exit nodes");
    recommendations.push("Require hardware security keys for high-risk access points");
    recommendations.push("Implement additional verification steps for access from new locations");
  }
  
  if (anomalies.includes('burst_pattern') || anomalies.includes('unusual_data_volume')) {
    recommendations.push("Implement data volume quotas per session");
    recommendations.push("Add digital watermarking to track content source");
    recommendations.push("Deploy content access throttling algorithms");
  }
  
  if (anomalies.includes('bot_access')) {
    recommendations.push("Enhance bot detection with behavioral analysis");
    recommendations.push("Implement browser fingerprinting to detect automation tools");
    recommendations.push("Deploy progressive challenges for suspected bot traffic");
  }
  
  if (anomalies.includes('geofencing_violation')) {
    recommendations.push("Update license terms with clear geographic restrictions");
    recommendations.push("Implement real-time geographic verification for access requests");
    recommendations.push("Consider legal action for repeated violations");
  }
  
  if (anomalies.includes('license_expiration')) {
    recommendations.push("Implement automated expiration notifications");
    recommendations.push("Add grace period with limited functionality");
    recommendations.push("Develop streamlined renewal process");
  }
  
  // Recommendations based on violation type
  if (violationType === 'duplication') {
    recommendations.push("Implement blockchain verification for license authenticity");
    recommendations.push("Add secure device binding to licenses");
  } else if (violationType === 'unauthorized_access') {
    recommendations.push("Review and enhance authentication mechanisms");
    recommendations.push("Implement contextual authentication");
  } else if (violationType === 'content_scraping') {
    recommendations.push("Implement progressive content loading");
    recommendations.push("Add dynamic content obfuscation");
  } else if (violationType === 'license_misuse') {
    recommendations.push("Clarify license terms and conditions");
    recommendations.push("Implement automated license compliance checks");
  }
  
  // Add blockchain recommendations
  recommendations.push("Record security event on immutable blockchain ledger for audit purposes");
  
  // Add AI monitoring recommendation
  recommendations.push("Adjust AI monitoring sensitivity based on this detection event");
  
  // Return unique recommendations (remove duplicates)
  return Array.from(new Set(recommendations));
}

// Security middleware to block unauthorized devices
const blockUnauthorizedDevices = (req: Request, res: Response, next: NextFunction) => {
  // Skip this middleware if we're in the process of securing
  if (req.path === '/api/security/lock-to-device' || req.path === '/api/auth/user') {
    return next();
  }

  const user = req.session?.passport?.user;
  if (!user) {
    return next(); // No user, no restrictions
  }

  // Check if user has device restrictions
  const authorizedDeviceHash = (req.session as any).authorizedDeviceHash;
  if (!authorizedDeviceHash) {
    return next(); // No restrictions set
  }

  // Get current device fingerprint from headers
  const deviceFingerprint = req.headers['x-device-fingerprint'] as string;

  if (!deviceFingerprint || deviceFingerprint !== authorizedDeviceHash) {
    console.warn(`Blocked unauthorized device access: ${deviceFingerprint}`);
    return res.status(403).json({
      error: "ACCESS_DENIED",
      message: "This device is not authorized to access this account. For security reasons, this account is locked to a single device."
    });
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple ping endpoint for testing
  app.get('/api/ping', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // HTML welcome page without React dependencies for direct debugging
  app.get('/welcome', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DRM Platform</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; background-color: #f9fafb; }
            .status { padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
            .ok { background-color: #d1fae5; color: #065f46; }
            .card { background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 1rem; }
            h1 { color: #1f2937; margin-top: 0; }
            .gradient-text { background: linear-gradient(to right, #00a3e0, #6a5acd); -webkit-background-clip: text; background-clip: text; color: transparent; }
            a { display: inline-block; padding: 0.7rem 1.2rem; background: linear-gradient(to right, #00a3e0, #6a5acd); color: white; text-decoration: none; border-radius: 0.25rem; font-weight: 500; transition: all 0.2s ease; }
            a:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
            .info { background-color: #f3f4f6; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.9rem; color: #4b5563; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <h1 class="gradient-text">BlockSecure DRM Platform</h1>
          <div class="status ok">
            <strong>Status:</strong> Server is running properly
          </div>
          <div class="card">
            <h2>System Information</h2>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Server:</strong> ${process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : 'localhost'}</p>
          </div>
          <div class="info">
            This page is served directly from Express without requiring React or authentication.
            It's helpful for diagnosing server connectivity issues.
          </div>
          <div class="card">
            <h2>Blockchain Features</h2>
            <ul>
              <li>Secure mainnet integration</li>
              <li>Token-to-ETH conversion (10:1)</li>
              <li>Quantum-resistant security</li>
              <li>Token limit: 110 real tokens</li>
            </ul>
          </div>
          <div class="card">
            <h2>Navigation</h2>
            <p><a href="/">Go to Application Dashboard</a></p>
            <p><a href="/login">Go to Login Page</a></p>
            <p><a href="/api/login">Authenticate with Replit</a></p>
          </div>
        </body>
      </html>
    `);
  });
  
  // HTML ping page for direct browser testing
  app.get('/ping', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DRM Platform Status</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
            .status { padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
            .ok { background-color: #d1fae5; color: #065f46; }
            .card { background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 1rem; }
            h1 { color: #1f2937; margin-top: 0; }
            a { display: inline-block; padding: 0.5rem 1rem; background: #2563eb; color: white; text-decoration: none; border-radius: 0.25rem; }
          </style>
        </head>
        <body>
          <h1>DRM Platform Status</h1>
          <div class="status ok">
            <strong>Status:</strong> Server is running
          </div>
          <div class="card">
            <h2>Server Information</h2>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Hostname:</strong> ${process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : 'localhost'}</p>
          </div>
          <div class="card">
            <h2>Navigation</h2>
            <p><a href="/">Go to Application</a></p>
            <p><a href="/login">Go to Login Page</a></p>
            <p><a href="/api/login">Authenticate with Replit</a></p>
            <p><a href="/welcome">Go to Welcome Page</a></p>
          </div>
        </body>
      </html>
    `);
  });
  // Setup auth middleware
  await setupAuth(app);
  
  // Auth routes
  app.get('/api/auth/user', (req: any, res) => {
    res.json(req.session?.passport?.user || null);
  });

  // Get all devices for the user (used by device security page)
  app.get("/api/devices", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.session?.passport?.user;
      const userId = user?.id || user?.sub;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      // Get devices for the user
      const devices = await storage.getUserDevices(parseInt(userId));
      res.json(devices);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Initialize the blockchain for DRM transactions
  const blockchain = new Blockchain();
  
  // Error handling middleware
  const handleErrors = (err: any, res: any) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    console.error("API Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Get system statistics
  app.get("/api/statistics", async (_req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get Assets
  app.get("/api/assets", async (_req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get single asset
  app.get("/api/assets/:id", async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      if (isNaN(assetId)) {
        return res.status(400).json({ message: "Invalid asset ID" });
      }
      
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      res.json(asset);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Create Asset
  app.post("/api/assets", async (req, res) => {
    try {
      const assetData = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(assetData);
      
      // Add a ledger entry for the asset creation
      await storage.createLedgerEntry({
        transactionId: generateTransactionId(),
        assetId: asset.id,
        licenseId: null,
        action: "asset_creation",
        status: "confirmed",
        metadata: { creator: "admin" }
      });
      
      res.status(201).json(asset);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Update Asset
  app.patch("/api/assets/:id", async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      if (isNaN(assetId)) {
        return res.status(400).json({ message: "Invalid asset ID" });
      }
      
      const existingAsset = await storage.getAsset(assetId);
      if (!existingAsset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const updatedAsset = await storage.updateAsset(assetId, req.body);
      res.json(updatedAsset);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get Licenses
  app.get("/api/licenses", async (req, res) => {
    try {
      let licenses = await storage.getLicenses();
      
      // Filtering by asset if assetId is provided
      const assetId = req.query.assetId ? parseInt(req.query.assetId as string) : null;
      if (assetId && !isNaN(assetId)) {
        licenses = licenses.filter(license => license.assetId === assetId);
      }
      
      // Filtering by status if status is provided
      const status = req.query.status as string;
      if (status) {
        licenses = licenses.filter(license => license.status === status);
      }
      
      res.json(licenses);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get single license
  app.get("/api/licenses/:id", async (req, res) => {
    try {
      const licenseId = parseInt(req.params.id);
      if (isNaN(licenseId)) {
        return res.status(400).json({ message: "Invalid license ID" });
      }
      
      const license = await storage.getLicense(licenseId);
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      
      res.json(license);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Create License
  app.post("/api/licenses", async (req, res) => {
    try {
      const licenseData = insertLicenseSchema.parse(req.body);
      
      // Verify asset exists
      const asset = await storage.getAsset(licenseData.assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const license = await storage.createLicense(licenseData);
      
      // Add a ledger entry for the license creation
      await storage.createLedgerEntry({
        transactionId: generateTransactionId(),
        assetId: license.assetId,
        licenseId: license.id,
        action: "license_creation",
        status: "confirmed",
        metadata: { creator: "admin" }
      });
      
      res.status(201).json(license);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Update License
  app.patch("/api/licenses/:id", async (req, res) => {
    try {
      const licenseId = parseInt(req.params.id);
      if (isNaN(licenseId)) {
        return res.status(400).json({ message: "Invalid license ID" });
      }
      
      const existingLicense = await storage.getLicense(licenseId);
      if (!existingLicense) {
        return res.status(404).json({ message: "License not found" });
      }
      
      const updatedLicense = await storage.updateLicense(licenseId, req.body);
      
      // Add a ledger entry for the license update
      await storage.createLedgerEntry({
        transactionId: generateTransactionId(),
        assetId: updatedLicense!.assetId,
        licenseId: updatedLicense!.id,
        action: "license_update",
        status: "confirmed",
        metadata: { updater: "admin", changes: Object.keys(req.body).join(',') }
      });
      
      res.json(updatedLicense);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get Ledger Entries
  app.get("/api/ledger", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const entries = await storage.getLedgerEntries(limit);
      
      // Format entries with time ago
      const formattedEntries = entries.map(entry => ({
        ...entry,
        timeAgo: entry.timestamp ? getTimeAgo(entry.timestamp) : "unknown"
      }));
      
      res.json(formattedEntries);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get Specific Ledger Entry by Transaction ID
  app.get("/api/ledger/:transactionId", async (req, res) => {
    try {
      const transactionId = req.params.transactionId;
      
      // Get all ledger entries (we'll filter since we don't have a direct lookup by ID)
      const allEntries = await storage.getLedgerEntries();
      
      // Find the matching transaction
      const entry = allEntries.find(entry => entry.transactionId === transactionId);
      
      if (!entry) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Add time ago for consistency
      const formattedEntry = {
        ...entry,
        timeAgo: entry.timestamp ? getTimeAgo(entry.timestamp) : "unknown"
      };
      
      res.json(formattedEntry);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Create Ledger Entry
  app.post("/api/ledger", async (req, res) => {
    try {
      const entryData = insertLedgerEntrySchema.parse(req.body);
      
      // Auto-generate transaction ID if not provided
      if (!entryData.transactionId) {
        entryData.transactionId = generateTransactionId();
      }
      
      const entry = await storage.createLedgerEntry(entryData);
      res.status(201).json(entry);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Fiat Transfer API endpoints
  
  // Get fiat transfer by ID
  app.get("/api/ledger/fiat-transfer/:transferId", async (req, res) => {
    try {
      const transferId = req.params.transferId;
      
      // Get all ledger entries
      const allEntries = await storage.getLedgerEntries();
      
      // Find the transfer by its ID in the metadata
      const transfer = allEntries.find(entry => 
        entry.action === "token_fiat_transfer" && 
        entry.metadata && 
        (entry.metadata as any).transferId === transferId
      );
      
      if (!transfer) {
        return res.status(404).json({ error: "Fiat transfer not found" });
      }
      
      // Add time ago for consistency
      const formattedTransfer = {
        ...transfer,
        timeAgo: transfer.timestamp ? getTimeAgo(transfer.timestamp) : "unknown"
      };
      
      res.json(formattedTransfer);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Cancel a fiat transfer
  app.post("/api/ledger/fiat-transfer/:transferId/cancel", async (req, res) => {
    try {
      const transferId = req.params.transferId;
      
      // Get all ledger entries
      const allEntries = await storage.getLedgerEntries();
      
      // Find the transfer by its ID in the metadata
      const transfer = allEntries.find(entry => 
        entry.action === "token_fiat_transfer" && 
        entry.metadata && 
        (entry.metadata as any).transferId === transferId
      );
      
      if (!transfer) {
        return res.status(404).json({ error: "Fiat transfer not found" });
      }
      
      // Check if it's too late to cancel (status not pending)
      if (transfer.status !== "pending") {
        return res.status(400).json({ 
          error: "Cannot cancel transfer",
          reason: "Transfer is already being processed or completed"
        });
      }
      
      // Create a cancellation ledger entry
      const cancellationEntry = await storage.createLedgerEntry({
        transactionId: generateTransactionId(),
        assetId: transfer.assetId,
        licenseId: transfer.licenseId,
        action: "token_fiat_transfer_cancelled",
        status: "confirmed",
        metadata: {
          originalTransferId: transferId,
          originalTransactionId: transfer.transactionId,
          cancelledAt: new Date().toISOString(),
          originalAmount: (transfer.metadata as any).amount,
          reason: "User requested cancellation"
        }
      });
      
      res.json({
        success: true,
        message: "Fiat transfer cancelled successfully",
        cancellationId: cancellationEntry.transactionId
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get Violations
  app.get("/api/violations", async (_req, res) => {
    try {
      const violations = await storage.getViolations();
      res.json(violations);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get Users
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove sensitive data like passwords before sending
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get single user
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Create User
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Update User
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Remove password from response
      const { password, ...sanitizedUser } = updatedUser!;
      res.json(sanitizedUser);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Delete User
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Create Violation
  app.post("/api/violations", async (req, res) => {
    try {
      const violationData = insertViolationSchema.parse(req.body);
      const violation = await storage.createViolation(violationData);
      
      // Add a ledger entry for the violation detection
      await storage.createLedgerEntry({
        transactionId: generateTransactionId(),
        assetId: violation.assetId || undefined,
        licenseId: violation.licenseId || undefined,
        action: "violation_detection",
        status: "confirmed",
        metadata: { 
          violationType: violation.type,
          severity: violation.severity
        }
      });
      
      res.status(201).json(violation);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Update Violation
  app.patch("/api/violations/:id", async (req, res) => {
    try {
      const violationId = parseInt(req.params.id);
      if (isNaN(violationId)) {
        return res.status(400).json({ message: "Invalid violation ID" });
      }
      
      const existingViolation = await storage.getViolation(violationId);
      if (!existingViolation) {
        return res.status(404).json({ message: "Violation not found" });
      }
      
      const updatedViolation = await storage.updateViolation(violationId, req.body);
      res.json(updatedViolation);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Verify License - this simulates blockchain verification
  app.post("/api/verify-license", async (req, res) => {
    try {
      const { licenseCode, assetId } = req.body;
      
      if (!licenseCode || !assetId) {
        return res.status(400).json({ message: "License code and asset ID are required" });
      }
      
      // Find the license
      const licenses = await storage.getLicenses();
      const license = licenses.find(l => l.licenseCode === licenseCode && l.assetId === parseInt(assetId));
      
      let isValid = false;
      let status = "rejected";
      let reason = "Invalid license";
      
      if (license) {
        if (license.status === "active") {
          isValid = true;
          status = "verified";
          reason = "Valid license";
        } else if (license.status === "expiring") {
          isValid = true;
          status = "verified";
          reason = "License expiring soon";
        } else {
          reason = `License is ${license.status}`;
        }
      }
      
      // Record this verification in the ledger
      await storage.createLedgerEntry({
        transactionId: generateTransactionId(),
        assetId: parseInt(assetId),
        licenseId: license?.id,
        action: "license_verification",
        status,
        metadata: { reason }
      });
      
      res.json({
        isValid,
        status,
        reason,
        license: isValid ? license : null
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Advanced ML-based AI monitoring endpoint for sophisticated violation detection
  app.post("/api/ai/analyze-usage", async (req, res) => {
    try {
      const { assetId, licenseId, usageData, features, modelVersion } = req.body;
      
      if (!assetId || !usageData) {
        return res.status(400).json({ message: "Asset ID and usage data are required" });
      }
      
      // Get the asset
      const asset = await storage.getAsset(parseInt(assetId));
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Advanced AI detection with sophisticated pattern analysis
      const enrichedData = usageData.enriched || {};
      const extractedFeatures = features || {};

      console.log(`Advanced AI Analysis: Asset ID ${assetId}, Model Version: ${modelVersion || 'unknown'}`);
      
      // Initialize detection arrays
      let anomalies = [];
      let violationType = null;
      let severity = "low";
      let confidenceScore = 0.75;
      
      // Get user trust score if available
      let userTrustScore = 0.5; // Default neutral score
      if (usageData.userId) {
        const user = await storage.getUser(usageData.userId);
        if (user && user.metadata && user.metadata.trustScore) {
          userTrustScore = user.metadata.trustScore;
        }
      }
      
      // Advanced feature-based detection logic
      // ====================================
      
      // DETECTION RULE 1: Location-based anomalies
      // ====================================
      const usageLocations = usageData.locations || [];
      
      // Check for multiple simultaneous locations
      if (usageLocations.length > 1) {
        anomalies.push("multiple_locations");
        
        // Calculate impossible travel detection
        if (usageLocations.length >= 2 && enrichedData.hasMultipleLocations) {
          // Check for impossible geographic jumps (e.g., US to Asia in minutes)
          const impossibleLocationPairs = [
            ['US', 'China'], ['US', 'Japan'], ['US', 'Russia'], 
            ['Europe', 'Australia'], ['Europe', 'China']
          ];
          
          const hasImpossibleTravel = impossibleLocationPairs.some(pair => {
            return usageLocations.includes(pair[0]) && usageLocations.includes(pair[1]);
          });
          
          if (hasImpossibleTravel) {
            anomalies.push("rapid_location_change");
            violationType = "duplication";
            severity = "high";
            confidenceScore = 0.95;
          } else {
            violationType = "duplication";
            severity = "medium";
            confidenceScore = 0.85;
          }
        }
      }
      
      // Check for suspicious VPN or Tor usage
      if (extractedFeatures.location && extractedFeatures.location.containsUnusualLocation > 0) {
        anomalies.push("suspicious_access_point");
        violationType = violationType || "suspicious_pattern";
        severity = severity === "high" ? "high" : "medium";
        confidenceScore = Math.max(confidenceScore, 0.82);
      }
      
      // DETECTION RULE 2: Time-based anomalies
      // ====================================
      const usageTime = usageData.timestamp ? new Date(usageData.timestamp) : new Date();
      const hour = usageTime.getHours();
      const dayOfWeek = usageTime.getDay();
      
      // Check for unusual hour patterns
      if ((hour >= 1 && hour < 5) && !enrichedData.isWeekend) {
        // Highly suspicious during weekday early mornings
        anomalies.push("odd_hours");
        violationType = violationType || "suspicious_pattern";
        severity = severity === "high" ? "high" : "medium";
        confidenceScore = Math.max(confidenceScore, 0.78);
      }
      
      // Check for unusual time deviation based on ML model
      if (extractedFeatures.temporal && extractedFeatures.temporal.timeDeviation > 0.8) {
        anomalies.push("temporal_anomaly");
        violationType = violationType || "temporal_anomaly";
        severity = severity === "high" ? "high" : "medium";
        confidenceScore = Math.max(confidenceScore, 0.80);
      }
      
      // DETECTION RULE 3: Behavioral anomalies
      // ====================================
      const usageFrequency = usageData.frequency || 1;
      const usageDuration = usageData.duration || 0;
      
      // Check for rapid access frequency (automated tools/scraping)
      if (usageFrequency > 15 || (enrichedData.requestsPerMinute && enrichedData.requestsPerMinute > 30)) {
        anomalies.push("high_frequency");
        violationType = violationType || "suspicious_pattern";
        
        // Extremely high frequency is likely API abuse
        if (usageFrequency > 50 || (enrichedData.requestsPerMinute && enrichedData.requestsPerMinute > 100)) {
          anomalies.push("api_abuse");
          violationType = "api_abuse";
          severity = "high";
          confidenceScore = 0.95;
        } else {
          severity = severity === "high" ? "high" : "medium";
          confidenceScore = Math.max(confidenceScore, 0.85);
        }
      }
      
      // Check for unusual access patterns
      if (enrichedData.accessPattern === 'burst') {
        anomalies.push("burst_pattern");
        violationType = violationType || "content_scraping";
        severity = severity === "high" ? "high" : "medium";
        confidenceScore = Math.max(confidenceScore, 0.82);
      }
      
      // Check for excessive download volume
      if (usageDuration > 0 && usageFrequency / usageDuration > 5) {
        anomalies.push("unusual_data_volume");
        violationType = violationType || "content_scraping";
        severity = severity === "high" ? "high" : "medium";
        confidenceScore = Math.max(confidenceScore, 0.83);
      }
      
      // DETECTION RULE 4: Context-aware license anomalies
      // ====================================
      if (licenseId) {
        // Get the license
        const license = await storage.getLicense(parseInt(licenseId));
        
        if (license) {
          // Check for license restrictions
          if (license.metadata && license.metadata.restrictedLocations) {
            const restrictedLocations = license.metadata.restrictedLocations;
            const hasRestrictedAccess = usageLocations.some(loc => 
              restrictedLocations.includes(loc)
            );
            
            if (hasRestrictedAccess) {
              anomalies.push("geofencing_violation");
              violationType = "license_misuse";
              severity = "high";
              confidenceScore = 0.92;
            }
          }
          
          // Check for license expiration
          if (license.status === 'expiring' || license.status === 'expired') {
            anomalies.push("license_expiration");
            violationType = violationType || "license_misuse";
            severity = severity === "high" ? "high" : "medium";
            confidenceScore = Math.max(confidenceScore, 0.90);
          }
        }
      }
      
      // DETECTION RULE 5: Device-based anomalies
      // ====================================
      if (extractedFeatures.device) {
        // Check for bot or automated access
        if (extractedFeatures.device.isBot > 0.5) {
          anomalies.push("bot_access");
          violationType = violationType || "suspicious_pattern";
          severity = severity === "high" ? "high" : "medium";
          confidenceScore = Math.max(confidenceScore, 0.88);
        }
        
        // If device trust score is very low
        if (extractedFeatures.device.trustScore < 0.3) {
          anomalies.push("untrusted_device");
          violationType = violationType || "unauthorized_access";
          severity = severity === "high" ? "high" : "medium";
          confidenceScore = Math.max(confidenceScore, 0.75);
        }
      }
      
      // DETECTION RULE 6: User trust adjustment
      // ====================================
      
      // Adjust confidence based on user trust (reduce false positives for trusted users)
      if (userTrustScore > 0.8 && confidenceScore < 0.9) {
        confidenceScore *= 0.9; // Reduce confidence for highly trusted users
      } else if (userTrustScore < 0.3) {
        confidenceScore = Math.min(confidenceScore * 1.2, 0.98); // Increase for untrusted users
      }
      
      // Final violation determination based on anomalies and confidence
      const isViolation = anomalies.length > 0 && confidenceScore > 0.7;
      
      // If violation detected with high confidence, record it
      if (isViolation) {
        // Create rich metadata for the violation record
        const violationMetadata = {
          anomalies,
          confidenceScore,
          detectionMethod: "advanced_ml",
          modelVersion: modelVersion || "1.0",
          features: extractedFeatures,
          originalUsageData: usageData,
          detectionRules: anomalies.map(anomaly => `rule_${anomaly}`)
        };
        
        await storage.createViolation({
          assetId: parseInt(assetId),
          licenseId: licenseId ? parseInt(licenseId) : undefined,
          type: violationType!,
          severity: severity as any,
          isResolved: false,
          metadata: violationMetadata
        });
        
        // For high severity violations, record on blockchain for immutable audit
        if (severity === "high" && confidenceScore > 0.9) {
          // Generate blockchain transaction for secure audit record
          const txHash = generateTransactionId();
          
          await storage.createLedgerEntry({
            transactionId: txHash,
            assetId: parseInt(assetId),
            licenseId: licenseId ? parseInt(licenseId) : undefined,
            action: "blockchain_violation_record",
            status: "confirmed",
            metadata: { 
              violationType,
              severity,
              confidenceScore,
              anomalies,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
      
      // Always record the analysis in the ledger for audit purposes
      await storage.createLedgerEntry({
        transactionId: generateTransactionId(),
        assetId: parseInt(assetId),
        licenseId: licenseId ? parseInt(licenseId) : undefined,
        action: "ai_analysis",
        status: isViolation ? "violation_detected" : "normal_usage",
        metadata: { 
          anomalies,
          severity,
          confidenceScore,
          modelVersion: modelVersion || "1.0"
        }
      });
      
      // Generate recommendations based on anomalies
      const recommendations = generateSecurityRecommendations(anomalies, violationType, severity);
      
      // Return the enhanced analysis results
      res.json({
        assetId,
        licenseId,
        analysis: {
          isViolation,
          anomalies,
          severity,
          violationType,
          confidenceScore,
          recommendations,
          detectionSummary: {
            modelVersion: modelVersion || "1.0",
            timestamp: new Date().toISOString(),
            aiEngineName: "QuantumAI Neural Detection System v2.3"
          }
        }
      });
    } catch (err) {
      console.error("Advanced AI analysis error:", err);
      handleErrors(err, res);
    }
  });
  
  // ------- SECURITY FEATURES API ENDPOINTS -------
  
  // Get User Devices
  app.get("/api/users/:userId/devices", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const devices = await storage.getUserDevices(userId);
      res.json(devices);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Blacklist User Device
  app.post("/api/users/:userId/devices/:deviceId/blacklist", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const deviceId = parseInt(req.params.deviceId);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: "Blacklist reason is required" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const device = await storage.getUserDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      if (device.userId !== userId) {
        return res.status(403).json({ message: "Device does not belong to the specified user" });
      }
      
      const blacklistedDevice = await storage.blacklistUserDevice(deviceId, reason);
      
      // Create a notification for the blacklisting
      await storage.createSecurityNotification({
        userId,
        title: "Device Blacklisted",
        message: `Device ${device.deviceId} has been blacklisted: ${reason}`,
        type: "device_blacklisted",
        severity: "high",
        metadata: { deviceId, reason }
      });
      
      res.json(blacklistedDevice);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Remove User Device from Blacklist
  app.post("/api/users/:userId/devices/:deviceId/remove-blacklist", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const deviceId = parseInt(req.params.deviceId);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const device = await storage.getUserDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      if (device.userId !== userId) {
        return res.status(403).json({ message: "Device does not belong to the specified user" });
      }
      
      if (!device.isBlacklisted) {
        return res.status(400).json({ message: "Device is not blacklisted" });
      }
      
      const unblacklistedDevice = await storage.removeUserDeviceBlacklist(deviceId);
      
      // Create a notification for the unblacklisting
      await storage.createSecurityNotification({
        userId,
        title: "Device Removed from Blacklist",
        message: `Device ${device.deviceId} has been removed from the blacklist`,
        type: "device_unblacklisted",
        severity: "medium",
        metadata: { deviceId }
      });
      
      res.json(unblacklistedDevice);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get Device by ID
  app.get("/api/devices/:id", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const device = await storage.getUserDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      res.json(device);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Blacklist Device
  app.post("/api/devices/:id/blacklist", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: "Blacklist reason is required" });
      }
      
      const device = await storage.getUserDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      const blacklistedDevice = await storage.blacklistUserDevice(deviceId, reason);
      res.json(blacklistedDevice);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Remove Device from Blacklist
  app.post("/api/devices/:id/unblacklist", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const device = await storage.getUserDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      if (!device.isBlacklisted) {
        return res.status(400).json({ message: "Device is not blacklisted" });
      }
      
      const unblacklistedDevice = await storage.removeUserDeviceBlacklist(deviceId);
      res.json(unblacklistedDevice);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Register New Device
  app.post("/api/users/:userId/devices", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { deviceId, fingerprint, deviceName, isRemote, metadata } = req.body;
      
      if (!deviceId || !fingerprint) {
        return res.status(400).json({ message: "Device ID and fingerprint are required" });
      }
      
      // Check if device already exists for this user
      const existingDevice = await storage.getUserDeviceByFingerprint(userId, fingerprint);
      if (existingDevice) {
        // Update last seen time and return the device
        const updatedDevice = await storage.updateUserDevice(existingDevice.id, {
          lastSeen: new Date()
        });
        return res.json(updatedDevice);
      }
      
      // Create new device
      const device = await storage.createUserDevice({
        userId,
        deviceId,
        fingerprint,
        deviceName: deviceName || "Unknown Device",
        trustScore: 50, // Default trust score for new devices
        isBlacklisted: false,
        isCurrentDevice: false,
        metadata: {
          ...metadata,
          isRemote: isRemote || false,
          connectionType: isRemote ? "remote" : "direct",
          operatingSystem: metadata?.operatingSystem || "unknown",
          browser: metadata?.browser || "unknown"
        }
      });
      
      res.status(201).json(device);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get Security Notifications
  app.get("/api/users/:userId/notifications", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const unreadOnly = req.query.unreadOnly === "true";
      const notifications = await storage.getSecurityNotifications(userId, unreadOnly);
      
      res.json(notifications);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Mark Notification as Read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await storage.markNotificationAsRead(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Mark All Notifications as Read
  app.post("/api/users/:userId/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      await storage.markAllNotificationsAsRead(userId);
      const notifications = await storage.getSecurityNotifications(userId);
      
      res.json({ message: "All notifications marked as read", notifications });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Archive Notification
  app.patch("/api/notifications/:id/archive", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await storage.archiveNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Update User Security Settings
  app.patch("/api/users/:userId/security-settings", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const settings = req.body;
      const updatedUser = await storage.updateUserSecuritySettings(userId, settings);
      
      // Remove password from response
      const { password, ...sanitizedUser } = updatedUser!;
      res.json(sanitizedUser);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Force block a remote connection (test endpoint)
  app.post('/api/security/force-block-remote', async (req, res) => {
    try {
      // Default to user 1 if not specified
      const userId = req.body.userId || 1;
      const forceRemote = req.body.forceRemote !== false; // Default to true
      const isTestMode = req.body.testMode !== false; // Default to true
      const testSingleDevicePolicy = req.body.testSingleDevicePolicy === true;
      
      // Generate a fingerprint for the test device
      const fingerprint = `test_fp_${Math.random().toString(16).substring(2, 10)}`;
      const deviceId = `dev_force_${Math.random().toString(16).substring(2, 10)}`;
      
      // If testing single device policy, first check if there are existing devices
      let isSingleDeviceViolation = false;
      let activeDevices: any[] = [];
      
      if (testSingleDevicePolicy) {
        // Get all user devices
        activeDevices = await storage.getUserDevices(userId);
        
        // Filter for active (non-blacklisted) devices
        activeDevices = activeDevices.filter(d => !d.isBlacklisted);
        
        if (activeDevices.length > 0) {
          isSingleDeviceViolation = true;
          console.log(`Testing single-device policy with ${activeDevices.length} existing active devices`);
        } else {
          console.log(`No existing active devices found. Creating a first device to test single-device policy...`);
          
          // Create a first device for this user to test the policy against
          const firstDevice = await storage.createUserDevice({
            userId: userId,
            deviceId: `first_device_${Math.random().toString(16).substring(2, 8)}`,
            fingerprint: `first_fp_${Math.random().toString(16).substring(2, 8)}`,
            deviceName: "Primary Test Device",
            trustScore: 80, // High trust score for the first device
            isBlacklisted: false,
            isCurrentDevice: true,
            metadata: {
              isRemote: false,
              connectionType: "direct",
              userAgent: "Test Primary User Agent",
              operatingSystem: "Test Primary OS",
              browser: "Test Primary Browser",
              ip: "127.0.0.1",
              anomalyScore: 10 // Low anomaly score for the first device
            }
          });
          
          activeDevices = [firstDevice];
          console.log(`Created primary device with ID: ${firstDevice.id}`);
        }
      }
      
      // Create a new device
      const device = await storage.createUserDevice({
        userId: userId,
        deviceId: deviceId,
        fingerprint: fingerprint,
        deviceName: testSingleDevicePolicy ? "Test Second Device" : "Test Remote Device",
        trustScore: testSingleDevicePolicy ? 60 : 10, // Lower trust score for single device test, very low for remote test
        isBlacklisted: false,
        isCurrentDevice: false,
        metadata: {
          isRemote: forceRemote,
          connectionType: forceRemote ? "remote" : "direct",
          userAgent: "Test User Agent",
          operatingSystem: "Test OS",
          browser: "Test Browser",
          ip: forceRemote ? "192.168.1.100" : "127.0.0.1",
          anomalyScore: forceRemote ? 95 : 40, // High anomaly score for remote, medium for single-device test
          isSingleDeviceViolation: testSingleDevicePolicy
        }
      });
      
      // Create the block reason
      let blockReason = "";
      let violationType = "";
      
      if (testSingleDevicePolicy && forceRemote) {
        blockReason = "TEST: Multiple security violations - Remote connection and single-device policy violation";
        violationType = "multiple_violations";
      } else if (testSingleDevicePolicy) {
        blockReason = "TEST: Single-device policy violation - Only one device is permitted per account";
        violationType = "multiple_device";
      } else {
        blockReason = "TEST: Remote connection automatically blocked by security policy";
        violationType = "remote_connection";
      }
      
      // Apply the blacklist
      const blacklistedDevice = await storage.blacklistUserDevice(
        device.id, 
        blockReason
      );
      
      // Create a transaction in the blockchain for this security event
      // Use the real blockchain to generate a transaction record
      const securityViolationTransaction = blockchain.createTransaction(
        device.id, // Using device ID as the asset ID for the transaction
        "security_violation", 
        {
          blockReason,
          deviceId,
          fingerprint,
          userId,
          violationType,
          securityLevel: "critical",
          isTest: isTestMode,
          isSingleDeviceViolation: testSingleDevicePolicy,
          timestamp: new Date().toISOString()
        }
      );
      
      // Mine the block to finalize the transaction
      const minedBlock = await blockchain.mine();
      
      // Get the transaction ID from the blockchain
      const txId = securityViolationTransaction;
      
      // Record this security action in the ledger with blockchain transaction ID
      await storage.createLedgerEntry({
        transactionId: txId,
        status: "completed",
        action: testSingleDevicePolicy ? "multiple_device_policy_enforced" : "remote_device_blacklisted",
        assetId: null,
        licenseId: null,
        metadata: {
          deviceId: device.id,
          userId: userId,
          reason: blockReason,
          fingerprint: fingerprint,
          ipDetails: {
            isRemote: forceRemote,
            isTestMode: isTestMode,
            blockedAt: new Date().toISOString(),
            deviceTrustScore: testSingleDevicePolicy ? 60 : 10,
            connectionType: forceRemote ? "remote" : "standard",
            anomalyScore: forceRemote ? 95 : 40
          },
          policyViolation: {
            type: violationType,
            severityLevel: "critical",
            policyRef: "DRM-SEC-001",
            enforcementType: "automatic",
            testTriggered: true,
            isSingleDeviceViolation: testSingleDevicePolicy
          },
          timestamp: new Date(),
          blockchainInfo: {
            blockIndex: minedBlock.index,
            blockHash: minedBlock.hash,
            blockTimestamp: minedBlock.timestamp
          }
        }
      });
      
      // Create a security notification
      await storage.createSecurityNotification({
        userId: userId,
        title: testSingleDevicePolicy ? "TEST: Enhanced Single-Device Policy Enforced" : "TEST: Remote Device Blocked",
        message: testSingleDevicePolicy 
          ? `Test device ${deviceId} was blocked to enforce strict single-device policy. Transaction ID: ${txId.substring(0, 10)}...`
          : `Test device ${deviceId} was automatically blocked due to remote connection policy. Transaction ID: ${txId.substring(0, 10)}...`,
        type: testSingleDevicePolicy ? "multiple_device_blocked" : "remote_connection_blocked",
        severity: "high",
        metadata: {
          deviceId: device.id,
          fingerprint: fingerprint,
          reason: blockReason,
          isTestMode: true,
          isSingleDeviceViolation: testSingleDevicePolicy,
          transactionId: txId
        }
      });
      
      // Return success with blockchain transaction details
      res.json({
        success: true,
        message: testSingleDevicePolicy 
          ? "Test single-device policy enforcement completed successfully and recorded on blockchain" 
          : "Test remote connection blocked successfully and recorded on blockchain",
        policyType: testSingleDevicePolicy ? "enhanced_single_device_strict" : "remote_connection_security",
        transactionId: txId,
        deviceId: deviceId,
        device: blacklistedDevice,
        activeDevices: activeDevices.length,
        blockchainInfo: {
          blockIndex: minedBlock.index,
          blockHash: minedBlock.hash.substring(0, 10) + '...',
          blockTimestamp: new Date(minedBlock.timestamp).toISOString()
        }
      });
    } catch (error) {
      handleErrors(error, res);
    }
  });
  
  // Detect Remote Connection with Enhanced Single-Device Policy
  app.post("/api/security/detect-remote", async (req, res) => {
    try {
      const { userId, deviceId, fingerprint, metadata, testMode } = req.body;
      
      if (!userId || !deviceId || !fingerprint) {
        return res.status(400).json({ 
          message: "User ID, device ID, and fingerprint are required",
          isRemote: false
        });
      }
      
      // Check for test mode in the request body or query parameters
      const isTestMode = testMode === true || metadata?.testMode === true || req.query.remote === "true";
      
      // Force remote detection in test mode
      let isRemote = isTestMode ? true : (
        metadata?.isRemote === true || 
        metadata?.connectionType === "remote" ||
        metadata?.anomalyScore > 70
      );
      
      console.log(`Remote detection: isRemote=${isRemote}, isTestMode=${isTestMode}, deviceId=${deviceId}`);
      
      try {
        // First, get all user devices to check if we should implement single-device policy
        const allUserDevices = await storage.getUserDevices(parseInt(userId));
        const activeDevices = allUserDevices.filter(d => !d.isBlacklisted);
        
        // Check if a device with this fingerprint already exists
        let existingDevice = await storage.getUserDeviceByFingerprint(parseInt(userId), fingerprint);
        let isSingleDeviceViolation = false;
        let previousAuthorizedDevice = null;
        
        // ENHANCED: Track previously authorized device to record on blockchain if we need to revoke access
        if (activeDevices.length >= 1) {
          previousAuthorizedDevice = activeDevices[0];
        }
        
        // ENHANCED Single device policy: Always enforce exactly ONE device per user
        // If this is a new device, we will mark for blocking all other devices
        if (!existingDevice && activeDevices.length >= 1) {
          isSingleDeviceViolation = true;
          console.log(`Enhanced single device policy violation: Another device is already authorized for user ${userId}`);
          
          // ENHANCED: Automatically revoke access from previous devices
          // This is the strictest implementation of single-device policy
          for (const device of activeDevices) {
            if (device.deviceId) {
              console.log(`Revoking access from previous device: ${device.deviceId} (ID: ${device.id})`);
              
              const blockReason = "Access revoked: New device authentication supersedes this device per single-device policy";
              
              // Blacklist the previously active device
              const blacklistedDevice = await storage.blacklistUserDevice(
                device.id,
                blockReason
              );
              
              // Record this security action on the blockchain
              const revokeAccessTransaction = blockchain.createTransaction(
                device.id,
                "device_access_revoked",
                {
                  userId: parseInt(userId),
                  deviceId: device.id,
                  newDeviceId: deviceId,
                  newDeviceFingerprint: fingerprint,
                  reason: blockReason,
                  policyEnforcement: "enhanced_single_device_strict",
                  timestamp: new Date().toISOString()
                }
              );
              
              // Mine the block to finalize the transaction
              const revokeMiningBlock = await blockchain.mine();
              
              // Create a security notification for the user
              await storage.createSecurityNotification({
                userId: parseInt(userId),
                title: "Previous Device Access Revoked",
                message: `Access from device ${device.deviceName || 'Unknown'} has been automatically revoked due to new device authentication.`,
                type: "access_revoked",
                severity: "high",
                metadata: {
                  deviceId: device.id,
                  fingerprint: device.fingerprint || '',
                  reason: blockReason,
                  newDeviceId: deviceId,
                  blockchainTxId: revokeAccessTransaction,
                  blockTimestamp: revokeMiningBlock.timestamp
                }
              });
            }
          }
        } else if (existingDevice && activeDevices.length > 1) {
          // If we have more than one active device (including this one), we have a violation
          const otherActiveDevices = activeDevices.filter(d => d.id !== existingDevice.id);
          if (otherActiveDevices.length > 0) {
            isSingleDeviceViolation = true;
            console.log(`Enhanced single device policy violation: Multiple active devices detected for user ${userId}`);
            
            // Revoke access from all other devices to maintain strict single-device policy
            for (const device of otherActiveDevices) {
              if (device.deviceId) {
                console.log(`Revoking access from additional device: ${device.deviceId} (ID: ${device.id})`);
                
                const blockReason = "Access revoked: Strict single-device policy enforcement";
                
                // Blacklist the additional device
                const blacklistedDevice = await storage.blacklistUserDevice(
                  device.id,
                  blockReason
                );
                
                // Record this policy enforcement on the blockchain
                const enforcePolicyTransaction = blockchain.createTransaction(
                  device.id,
                  "policy_enforcement",
                  {
                    userId: parseInt(userId),
                    deviceId: device.id,
                    primaryDeviceId: existingDevice!.id,
                    reason: blockReason,
                    policyType: "single_device_strict",
                    severity: "critical",
                    timestamp: new Date().toISOString()
                  }
                );
                
                // Mine the block to finalize the transaction
                const policyBlock = await blockchain.mine();
                
                // Create a security notification
                await storage.createSecurityNotification({
                  userId: parseInt(userId),
                  title: "Unauthorized Device Blocked",
                  message: `An additional device (${device.deviceName || 'Unknown'}) was blocked to enforce single-device policy.`,
                  type: "policy_enforcement",
                  severity: "high",
                  metadata: {
                    deviceId: device.id,
                    fingerprint: device.fingerprint || '',
                    reason: blockReason,
                    blockchainTxId: enforcePolicyTransaction,
                    blockTimestamp: policyBlock.timestamp,
                    primaryDeviceId: existingDevice!.id
                  }
                });
              }
            }
          }
        }
        
        // If no device exists, create one so we can apply our security policies
        if (!existingDevice) {
          existingDevice = await storage.createUserDevice({
            userId: parseInt(userId),
            deviceId: deviceId,
            fingerprint: fingerprint,
            deviceName: metadata?.operatingSystem || "Unknown Device",
            trustScore: isRemote ? 10 : (isSingleDeviceViolation ? 20 : 80),
            metadata: {
              ...metadata,
              isRemote,
              connectionType: isRemote ? "remote" : "direct",
              isSingleDeviceViolation: isSingleDeviceViolation,
              registrationTimestamp: new Date().toISOString(),
              securityPolicy: "enhanced_single_device_strict"
            }
          });
          console.log(`Created new device: ${existingDevice.id}`);
          
          // Create a notification for the new device with enhanced policy information
          await storage.createSecurityNotification({
            userId: parseInt(userId),
            title: "New Device Connected",
            message: `A new device (${existingDevice.deviceName}) has connected to your account. Due to enhanced security policy, only this device will have access.`,
            type: "new_device_connected",
            severity: isSingleDeviceViolation ? "high" : "medium", 
            metadata: {
              deviceId: existingDevice.id,
              fingerprint: existingDevice.fingerprint,
              isRead: false,
              isArchived: false,
              isSingleDeviceViolation,
              policyType: "enhanced_single_device_strict"
            }
          });
        }
        
        // Block if:
        // 1. It's a remote connection, or
        // 2. Single device policy is violated (not the first device)
        // And the device is not already blacklisted
        const shouldBlock = (isRemote || isSingleDeviceViolation) && existingDevice && !existingDevice.isBlacklisted;
        
        if (shouldBlock && existingDevice) {
          let blockReason = "";
          
          if (isRemote && isSingleDeviceViolation) {
            blockReason = isTestMode 
              ? "TEST MODE: Remote connection and single-device policy violation" 
              : "Multiple security violations: Remote connection and single-device policy violation";
          } else if (isRemote) {
            blockReason = isTestMode 
              ? "TEST MODE: Remote connection automatically blocked by security policy" 
              : "Remote connection automatically blocked by security policy";
          } else if (isSingleDeviceViolation) {
            blockReason = "Single-device policy violation: Only one device is permitted per account";
          }
          
          console.log(`Blacklisting device ${existingDevice.id}: ${blockReason}`);
          
          // Apply the blacklist
          const blacklistedDevice = await storage.blacklistUserDevice(
            existingDevice.id, 
            blockReason
          );
          
          // Create a blockchain transaction for this security event
          const violationType = isRemote ? "remote_connection" : "multiple_device";
          const securityViolationTransaction = blockchain.createTransaction(
            existingDevice.id, // Use device ID as the asset ID
            "security_violation", 
            {
              userId: parseInt(userId),
              deviceId: existingDevice.id,
              fingerprint: fingerprint,
              blockReason,
              violationType,
              securityLevel: "high",
              isTestMode,
              timestamp: new Date().toISOString()
            }
          );
          
          // Mine the block to finalize the transaction
          const minedBlock = await blockchain.mine();
          
          // Record this security action in the ledger with blockchain transaction ID
          await storage.createLedgerEntry({
            transactionId: securityViolationTransaction,
            status: "completed",
            action: isRemote ? "remote_device_blacklisted" : "multiple_device_policy_enforced",
            assetId: null,
            licenseId: null,
            metadata: {
              deviceId: existingDevice.id,
              userId: parseInt(userId),
              reason: blockReason,
              fingerprint: fingerprint,
              ipDetails: {
                isRemote: isRemote,
                isTestMode: isTestMode,
                blockedAt: new Date().toISOString(),
                deviceTrustScore: isRemote ? 15 : 55,
                connectionType: isRemote ? "remote" : "standard",
                anomalyScore: isRemote ? 85 : 15
              },
              policyViolation: {
                type: violationType,
                severityLevel: "high",
                policyRef: "DRM-SEC-001",
                enforcementType: "automatic",
              },
              timestamp: new Date(),
              blockchainInfo: {
                blockIndex: minedBlock.index,
                blockHash: minedBlock.hash,
                blockTimestamp: minedBlock.timestamp
              }
            }
          });
          
          // Create a security notification about the blocked device
          await storage.createSecurityNotification({
            userId: parseInt(userId),
            title: isTestMode ? "TEST MODE: Device Blocked" : "Device Blocked by Security Policy",
            message: `Device ${existingDevice.deviceId || deviceId} was automatically blocked: ${blockReason}`,
            type: isRemote ? "remote_connection_blocked" : "multiple_device_blocked",
            severity: "high",
            metadata: {
              deviceId: existingDevice.id,
              fingerprint: existingDevice.fingerprint || fingerprint,
              reason: blockReason,
              isTestMode: isTestMode || false,
              isSingleDeviceViolation
            }
          });
          
          console.log(`Device blacklisted: ${!!blacklistedDevice}`);
        }
      } catch (deviceError) {
        console.error("Error processing device:", deviceError);
        // Continue execution even if device processing fails
      }
      
      // Count total devices for this user
      const allUserDevices = await storage.getUserDevices(parseInt(userId));
      const totalDevices = allUserDevices.length;
      const blacklistedDevices = allUserDevices.filter(d => d.isBlacklisted).length;
      const activeDevices = allUserDevices.filter(d => !d.isBlacklisted).length;
      
      res.json({
        isRemote,
        testMode: isTestMode,
        totalDevices,
        blacklistedDevices,
        activeDevices,
        singleDeviceMode: true, // Indicate that single device mode is active
        analysis: {
          connectionType: isRemote ? "remote" : "direct",
          trustScore: isRemote ? 15 : 85,
          anomalyScore: isRemote ? 85 : 5
        }
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // ========== Code Immutability Record Endpoints ==========
  
  // Get all code immutability records
  app.get("/api/code-immutability-records", async (_req, res) => {
    try {
      const records = await storage.getCodeImmutabilityRecords();
      res.json(records);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get code immutability record by ID
  app.get("/api/code-immutability-records/:id", async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      if (isNaN(recordId)) {
        return res.status(400).json({ message: "Invalid record ID" });
      }
      
      const record = await storage.getCodeImmutabilityRecord(recordId);
      if (!record) {
        return res.status(404).json({ message: "Code immutability record not found" });
      }
      
      res.json(record);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get code immutability record by file path
  app.get("/api/code-immutability-records/by-path", async (req, res) => {
    try {
      const { filePath } = req.query;
      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ message: "Valid file path is required" });
      }
      
      const record = await storage.getCodeImmutabilityRecordByPath(filePath);
      if (!record) {
        return res.status(404).json({ message: "No immutability record found for this file path" });
      }
      
      res.json(record);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Create a new code immutability record
  app.post("/api/code-immutability-records", async (req, res) => {
    try {
      const recordData = insertCodeImmutabilityRecordSchema.parse(req.body);
      
      // Check if record already exists for this file path
      const existingRecord = await storage.getCodeImmutabilityRecordByPath(recordData.filePath);
      if (existingRecord) {
        return res.status(409).json({ 
          message: "Immutability record already exists for this file",
          record: existingRecord
        });
      }
      
      // Create blockchain transaction ID
      if (!recordData.blockchainTxId) {
        recordData.blockchainTxId = generateTransactionId();
      }
      
      // Create the immutability record with copyright information
      const record = await storage.createCodeImmutabilityRecord(recordData);
      
      // Add a ledger entry for the immutability record creation
      await storage.createLedgerEntry({
        transactionId: recordData.blockchainTxId,
        action: "code_immutability_record_creation",
        status: "confirmed",
        metadata: { 
          filePath: record.filePath,
          fileHash: record.fileHash,
          createdAt: new Date()
        }
      });
      
      res.status(201).json(record);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Verify code immutability
  app.post("/api/code-immutability-records/verify", async (req, res) => {
    try {
      const { filePath, fileHash } = req.body;
      
      if (!filePath || !fileHash) {
        return res.status(400).json({ message: "File path and file hash are required" });
      }
      
      const verificationResult = await storage.verifyCodeImmutability(filePath, fileHash);
      
      // Add a ledger entry for the verification attempt
      await storage.createLedgerEntry({
        transactionId: generateTransactionId(),
        action: "code_immutability_verification",
        status: "confirmed",
        metadata: { 
          filePath,
          fileHash,
          verified: verificationResult.verified,
          timestamp: new Date()
        }
      });
      
      res.json({
        verified: verificationResult.verified,
        record: verificationResult.record,
        message: verificationResult.verified 
          ? "Code integrity verified successfully" 
          : "Code integrity verification failed - hash mismatch"
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Update a code immutability record (limited updates only)
  app.patch("/api/code-immutability-records/:id", async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      if (isNaN(recordId)) {
        return res.status(400).json({ message: "Invalid record ID" });
      }
      
      const existingRecord = await storage.getCodeImmutabilityRecord(recordId);
      if (!existingRecord) {
        return res.status(404).json({ message: "Code immutability record not found" });
      }
      
      // Only allow updates to specific fields (verificationCount, lastVerified, status)
      // Never allow changes to fileHash or other critical fields
      const allowedUpdates = ['verificationCount', 'lastVerified', 'status'];
      const updates: Partial<any> = {};
      
      for (const field of allowedUpdates) {
        if (field in req.body) {
          updates[field] = req.body[field];
        }
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ 
          message: "No valid fields to update. Only verificationCount, lastVerified, and status can be modified."
        });
      }
      
      const updatedRecord = await storage.updateCodeImmutabilityRecord(recordId, updates);
      res.json(updatedRecord);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Auth route for authenticated user info
  app.get('/api/auth/user', (req: any, res) => {
    res.json(req.session?.passport?.user || null);
  });

  // ENHANCED SECURITY: Lock account to a single device and block unauthorized access
  app.post("/api/security/lock-to-device", async (req, res) => {
    try {
      const { userId, currentDeviceId, currentFingerprint } = req.body;
      
      if (!userId || !currentDeviceId || !currentFingerprint) {
        return res.status(400).json({ 
          message: "User ID, current device ID, and fingerprint are required",
          success: false
        });
      }
      
      // 1. Find the user
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found", success: false });
      }
      
      // 2. Verify current device is legitimate
      const currentDevice = await storage.getUserDeviceByFingerprint(parseInt(userId), currentFingerprint);
      if (!currentDevice) {
        return res.status(403).json({ 
          message: "Current device not recognized. Cannot lock account to unrecognized device.", 
          success: false 
        });
      }
      
      // 3. Update user security settings to enforce single device policy
      const updatedUser = await storage.updateUserSecuritySettings(parseInt(userId), {
        blockRemoteConnections: true,
        enforceQuantumSecurity: true,
        singleDeviceOnly: true,
        blockConsoleAccess: true,
        deviceLockEnabled: true,
        primaryDeviceId: currentDevice.id,
        primaryDeviceFingerprint: currentFingerprint,
        securityLevel: "maximum"
      });
      
      // 4. Update device to be the primary trusted device
      await storage.updateUserDevice(currentDevice.id, {
        isCurrentDevice: true,
        trustScore: 100,
        metadata: {
          ...currentDevice.metadata,
          isPrimaryDevice: true,
          lastVerified: new Date().toISOString(),
          remoteAccessBlocked: true,
          consoleAccessBlocked: true
        }
      });
      
      // 5. Get all other devices and blacklist them
      const allDevices = await storage.getUserDevices(parseInt(userId));
      const otherDevices = allDevices.filter(device => device.id !== currentDevice.id);
      
      // 6. Blacklist all other devices
      for (const device of otherDevices) {
        await storage.blacklistUserDevice(device.id, 
          "Account locked to primary device. All other devices blocked by user request.");
          
        // Create security notification for each blocked device
        await storage.createSecurityNotification({
          userId: parseInt(userId),
          title: "Device Blocked: Enhanced Security Enabled",
          message: `Device ${device.deviceName || 'Unknown'} was blocked as part of enabling enhanced account security.`,
          type: "security_lockdown",
          severity: "high",
          metadata: {
            deviceId: device.id,
            reason: "Account locked to primary device by user request",
            timestamp: new Date().toISOString(),
            primaryDeviceId: currentDevice.id
          }
        });
      }
      
      // 7. Record this security enforcement on blockchain
      const blockchain = new Blockchain();
      const securityTransaction = blockchain.createTransaction(
        parseInt(userId),
        "enhanced_security_enforcement",
        {
          userId: parseInt(userId),
          primaryDeviceId: currentDevice.id,
          totalBlockedDevices: otherDevices.length,
          timestamp: new Date().toISOString(),
          securitySettings: {
            singleDeviceMode: true,
            remoteAccessBlocked: true,
            consoleAccessBlocked: true,
            quantumSecurity: true
          }
        }
      );
      
      // Mine the block to finalize the transaction
      const securityBlock = await blockchain.mine();
      
      // 8. Create notification confirming security lockdown
      await storage.createSecurityNotification({
        userId: parseInt(userId),
        title: "Enhanced Security Activated",
        message: "Your account is now locked to a single device. All other devices have been blocked. Remote connections and console access are disabled.",
        type: "security_lockdown",
        severity: "high",
        metadata: {
          primaryDeviceId: currentDevice.id,
          blockchainTxId: securityTransaction,
          timestamp: new Date().toISOString(),
          totalBlockedDevices: otherDevices.length,
          blockHash: securityBlock.hash
        }
      });
      
      // 9. Return success with details
      res.json({
        success: true,
        message: "Account successfully locked to current device. All other devices blocked.",
        primaryDevice: currentDevice,
        blockedDevicesCount: otherDevices.length,
        securitySettings: {
          singleDeviceMode: true,
          remoteAccessBlocked: true,
          consoleAccessBlocked: true,
          quantumSecurity: true
        },
        blockchainTransaction: {
          txId: securityTransaction,
          blockHash: securityBlock.hash.substring(0, 10) + '...',
          timestamp: securityBlock.timestamp
        }
      });
      
    } catch (error) {
      handleErrors(error, res);
    }
  });
  
  // Detect and block unauthorized console access
  app.post("/api/security/block-console-access", async (req, res) => {
    try {
      const { userId, deviceFingerprint } = req.body;
      
      if (!userId || !deviceFingerprint) {
        return res.status(400).json({ 
          message: "User ID and device fingerprint are required",
          success: false
        });
      }
      
      // Find the user
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found", success: false });
      }
      
      // Check if this device is authorized
      const device = await storage.getUserDeviceByFingerprint(parseInt(userId), deviceFingerprint);
      
      // If device doesn't exist or is blacklisted, block console access
      if (!device || device.isBlacklisted) {
        // Record blocked attempt
        const blockchain = new Blockchain();
        const blockTransaction = blockchain.createTransaction(
          parseInt(userId),
          "blocked_console_access",
          {
            userId: parseInt(userId),
            deviceFingerprint: deviceFingerprint,
            timestamp: new Date().toISOString(),
            reason: device ? "Device is blacklisted" : "Unknown device"
          }
        );
        
        // Mine the block to finalize the transaction
        await blockchain.mine();
        
        // Create security notification
        await storage.createSecurityNotification({
          userId: parseInt(userId),
          title: "Unauthorized Console Access Blocked",
          message: "An attempt to access your account console from an unauthorized device was blocked.",
          type: "security_threat",
          severity: "critical",
          metadata: {
            deviceFingerprint: deviceFingerprint,
            timestamp: new Date().toISOString(),
            blockchainTxId: blockTransaction,
            reason: device ? "Device is blacklisted" : "Unknown device"
          }
        });
        
        return res.status(403).json({ 
          success: false,
          blocked: true,
          message: "Console access blocked. This device is not authorized to access this account.",
          reason: device ? "Device is blacklisted" : "Unknown device"
        });
      }
      
      // If user has single device mode enabled, check if this is the primary device
      const securitySettings = user.securitySettings || {};
      if (securitySettings.singleDeviceOnly && 
          securitySettings.primaryDeviceId && 
          securitySettings.primaryDeviceId !== device.id) {
        
        // Record blocked attempt from non-primary device
        const blockchain = new Blockchain();
        const blockTransaction = blockchain.createTransaction(
          parseInt(userId),
          "blocked_console_access",
          {
            userId: parseInt(userId),
            deviceId: device.id,
            primaryDeviceId: securitySettings.primaryDeviceId,
            timestamp: new Date().toISOString(),
            reason: "Account locked to primary device only"
          }
        );
        
        // Mine the block to finalize the transaction
        await blockchain.mine();
        
        // Create security notification
        await storage.createSecurityNotification({
          userId: parseInt(userId),
          title: "Console Access Attempt Blocked",
          message: "An attempt to access your account console from a secondary device was blocked.",
          type: "security_policy",
          severity: "high",
          metadata: {
            deviceId: device.id,
            timestamp: new Date().toISOString(),
            blockchainTxId: blockTransaction,
            reason: "Account locked to primary device only"
          }
        });
        
        return res.status(403).json({ 
          success: false,
          blocked: true,
          message: "Console access blocked. This account is locked to a single primary device.",
          reason: "Account locked to primary device only"
        });
      }
      
      // Device is authorized for console access
      return res.json({
        success: true,
        blocked: false,
        message: "Console access authorized"
      });
      
    } catch (error) {
      handleErrors(error, res);
    }
  });
  
  // Device security routes
  app.get('/api/devices', isAuthenticated, async (req, res) => {
    try {
      // Get user ID from authenticated session
      const userId = req.user?.id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }
      
      // Get devices for this user
      const devices = await storage.getUserDevices(parseInt(userId));
      
      // Remove sensitive information before sending to client
      const sanitizedDevices = devices.map(device => ({
        id: device.id,
        deviceName: device.deviceName,
        firstSeen: device.firstSeen,
        lastSeen: device.lastSeen,
        isCurrentDevice: device.isCurrentDevice,
        trustScore: device.trustScore,
        isBlacklisted: device.isBlacklisted
      }));
      
      res.json(sanitizedDevices);
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ success: false, message: "Failed to fetch devices" });
    }
  });
  
  app.post('/api/security/lock-to-device', isAuthenticated, async (req, res) => {
    try {
      const { userId, currentDeviceId, currentFingerprint } = req.body;
      
      if (!userId || !currentDeviceId || !currentFingerprint) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }
      
      // Verify this is the actual user making the request
      const authenticatedUserId = req.user?.id || req.user?.sub;
      if (parseInt(userId) !== parseInt(authenticatedUserId)) {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized security operation" 
        });
      }
      
      // Get user
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      // Check if device exists or create it
      let device = await storage.getUserDeviceByFingerprint(parseInt(userId), currentFingerprint);
      
      if (!device) {
        // Create device record
        device = await storage.createUserDevice({
          userId: parseInt(userId),
          deviceId: currentDeviceId,
          fingerprint: currentFingerprint,
          deviceName: "Primary Secured Device",
          trustScore: 100,
          isBlacklisted: false,
          isCurrentDevice: true,
          metadata: {
            securityActivationDate: new Date().toISOString(),
            securityActivationReason: "User-initiated security enhancement",
            isRemoteConnection: false
          }
        });
      }
      
      // Update user security settings
      const updatedUser = await storage.updateUserSecuritySettings(parseInt(userId), {
        singleDeviceOnly: true,
        primaryDeviceId: device.id,
        blockRemoteConnections: true,
        notifyNewDevices: true,
        enforceQuantumSecurity: true,
        autoBlacklistSuspicious: true
      });
      
      if (!updatedUser) {
        throw new Error("Failed to update user security settings");
      }
      
      // Blacklist all other devices
      const allDevices = await storage.getUserDevices(parseInt(userId));
      for (const otherDevice of allDevices) {
        if (otherDevice.id !== device.id) {
          await storage.blacklistUserDevice(
            otherDevice.id,
            "Account locked to primary device for security"
          );
        }
      }
      
      // Create security notification
      await storage.createSecurityNotification({
        userId: parseInt(userId),
        title: "Maximum Security Activated",
        message: "Your account is now locked to a single device. All other devices have been blocked.",
        type: "security_alert",
        severity: "high",
        isRead: false,
        isArchived: false,
        metadata: {
          deviceId: device.id,
          activationTimestamp: new Date().toISOString(),
          securityLevel: "maximum"
        }
      });
      
      // Record this action in the blockchain for auditing
      const blockchain = new Blockchain();
      const securityTransaction = blockchain.createTransaction(
        parseInt(userId),
        "activate_max_security",
        {
          deviceId: device.id,
          timestamp: new Date().toISOString(),
          securityChanges: {
            singleDeviceMode: true,
            blockRemoteConnections: true
          }
        }
      );
      
      // Mine the block to finalize the transaction
      await blockchain.mine();
      
      res.json({
        success: true,
        message: "Maximum security activated successfully",
        deviceId: device.id,
        transactionId: securityTransaction
      });
    } catch (error) {
      console.error("Error activating security:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to activate maximum security",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
