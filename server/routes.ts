const express = require("express");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { setupAuth, isAuthenticated, ensureValidDevice } = require("./replitAuth");
const { storage } = require("./storage");
const { createHash } = require("crypto");
const { Web3 } = require("web3");
const { fileMonitor } = require("./code-integrity");
const { z } = require("zod");

// Set up a basic Web3 instance for blockchain interactions
const web3 = new Web3(process.env.ETHEREUM_RPC_URL || "https://mainnet.infura.io/v3/YOUR_INFURA_KEY");

// Function to generate a hash for code immutability
function generateCodeHash(code) {
  return createHash('sha256').update(code).digest('hex');
}

async function registerRoutes(app) {
  // Set up authentication
  await setupAuth(app);

  // User authentication routes
  app.get('/api/auth/user', (req, res) => {
    res.json(req.session?.passport?.user || null);
  });

  // Code immutability endpoints
  app.post('/api/immutability/store', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      const { code, metadata } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }
      
      const codeHash = generateCodeHash(code);
      
      // Check if this code has already been stored
      const existingRecord = await storage.getImmutabilityRecordByHash(codeHash);
      if (existingRecord) {
        return res.status(409).json({ 
          message: "This code hash already exists", 
          record: existingRecord 
        });
      }
      
      // Parse and validate the request
      const recordData = {
        codeHash,
        metadata: metadata || {},
        userId: req.user.id,
      };
      
      const record = await storage.createImmutabilityRecord(recordData);
      
      res.status(201).json(record);
    } catch (error) {
      console.error("Error storing code:", error);
      res.status(500).json({ 
        message: "Error storing code", 
        error: error.message 
      });
    }
  });
  
  app.post('/api/immutability/verify/:id', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { blockchainTxId } = req.body;
      
      if (!blockchainTxId) {
        return res.status(400).json({ message: "Blockchain transaction ID is required" });
      }
      
      const record = await storage.getImmutabilityRecord(id);
      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }
      
      // In a real implementation, we would verify the transaction on the blockchain
      // by checking if the transaction exists and contains the correct code hash
      // For now, we'll just update the record
      
      const verifiedRecord = await storage.verifyImmutabilityRecord(id, blockchainTxId);
      
      res.json(verifiedRecord);
    } catch (error) {
      console.error("Error verifying record:", error);
      res.status(500).json({ 
        message: "Error verifying record", 
        error: error.message 
      });
    }
  });
  
  app.get('/api/immutability/records', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const records = await storage.getImmutabilityRecords(userId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching records:", error);
      res.status(500).json({ 
        message: "Error fetching records", 
        error: error.message 
      });
    }
  });
  
  // Security logs endpoints
  app.post('/api/security/log', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      const logData = {
        ...req.body,
        userId: req.user.id,
        ipAddress: req.ip,
        deviceId: req.user.dbUser?.deviceId || null
      };
      
      const log = await storage.addSecurityLog(logData);
      
      res.status(201).json(log);
    } catch (error) {
      console.error("Error logging security event:", error);
      res.status(500).json({ 
        message: "Error logging security event", 
        error: error.message 
      });
    }
  });
  
  app.get('/api/security/logs', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      
      const logs = await storage.getSecurityLogs(userId, limit);
      
      res.json(logs);
    } catch (error) {
      console.error("Error fetching security logs:", error);
      res.status(500).json({ 
        message: "Error fetching security logs", 
        error: error.message 
      });
    }
  });
  
  // Access control endpoints
  app.post('/api/access/grant', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      const controlData = {
        ...req.body,
        userId: req.user.id
      };
      
      const control = await storage.addAccessControl(controlData);
      
      res.status(201).json(control);
    } catch (error) {
      console.error("Error granting access:", error);
      res.status(500).json({ 
        message: "Error granting access", 
        error: error.message 
      });
    }
  });
  
  app.delete('/api/access/revoke/:id', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const result = await storage.removeAccessControl(id);
      
      if (result) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Access control not found" });
      }
    } catch (error) {
      console.error("Error revoking access:", error);
      res.status(500).json({ 
        message: "Error revoking access", 
        error: error.message 
      });
    }
  });
  
  app.get('/api/access/check/:resourceId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.resourceId;
      
      const control = await storage.getAccessControl(userId, resourceId);
      
      res.json({
        resourceId,
        hasAccess: !!control,
        permission: control?.permission || null
      });
    } catch (error) {
      console.error("Error checking access:", error);
      res.status(500).json({ 
        message: "Error checking access", 
        error: error.message 
      });
    }
  });

  // Copyright information endpoint
  app.get('/api/copyright', (req, res) => {
    // Return copyright information
    res.json({
      copyright: "© 2025 Ervin Remus Radosavlevici",
      email: "ervin210@sky.com, ervin210@icloud.com",
      rights: "All rights reserved. This software is protected by copyright law.",
      notice: "Unauthorized copying, modification, distribution, or use of this software is strictly prohibited."
    });
  });

  // License key management endpoints
  app.post('/api/license/generate', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      const { userId, planType, maxActivations, expiresAt } = req.body;
      
      // Only admins can generate license keys for other users
      if (userId && userId !== req.user.id) {
        // Check if the current user has admin permission
        // In the future, implement proper admin check
        return res.status(403).json({ 
          message: "Only administrators can generate licenses for other users" 
        });
      }
      
      // Validate the request data
      const licenseData = {
        userId: userId || req.user.id,
        planType: planType || 'standard',
        maxActivations: maxActivations || 1,
        activationsLeft: maxActivations || 1,
        expiresAt: expiresAt || null
      };
      
      // Generate the license key
      const license = await storage.createLicenseKey(licenseData);
      
      // Log the license creation for security audit
      await storage.addSecurityLog({
        userId: req.user.id,
        event: 'license_generated',
        details: { licenseId: license.id, forUserId: license.userId },
        severity: 'info'
      });
      
      res.status(201).json(license);
    } catch (error) {
      console.error("Error generating license key:", error);
      res.status(500).json({ 
        message: "Error generating license key", 
        error: error.message 
      });
    }
  });
  
  app.get('/api/license/list', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const licenses = await storage.getUserLicenses(userId);
      
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ 
        message: "Error fetching licenses", 
        error: error.message 
      });
    }
  });
  
  app.get('/api/license/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const license = await storage.getLicenseKey(id);
      
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      
      // Only allow users to view their own licenses
      if (license.userId !== req.user.id) {
        // Check if the current user has admin permission
        // In the future, implement proper admin check
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(license);
    } catch (error) {
      console.error("Error fetching license:", error);
      res.status(500).json({ 
        message: "Error fetching license", 
        error: error.message 
      });
    }
  });
  
  app.post('/api/license/activate', isAuthenticated, async (req, res) => {
    try {
      const { licenseKey } = req.body;
      
      if (!licenseKey) {
        return res.status(400).json({ message: "License key is required" });
      }
      
      // Get the license by key
      const license = await storage.getLicenseKeyByCode(licenseKey);
      
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      
      // Get device information
      const deviceId = req.headers['x-device-id'] || req.cookies.deviceId || 'unknown-device';
      
      // Check if the license has already been activated on this device
      const activations = await storage.getLicenseActivations(license.id);
      const existingActivation = activations.find(a => a.deviceId === deviceId && a.isActive);
      
      if (existingActivation) {
        return res.json({
          message: "License already activated on this device",
          activation: existingActivation,
          license
        });
      }
      
      // Attempt to activate the license
      try {
        const activation = await storage.activateLicense({
          licenseId: license.id,
          deviceId,
          ipAddress: req.ip
        });
        
        // Log the activation for security audit
        await storage.addSecurityLog({
          userId: req.user.id,
          event: 'license_activated',
          details: { licenseId: license.id, activationId: activation.id },
          severity: 'info',
          deviceId
        });
        
        res.status(201).json({
          message: "License activated successfully",
          activation,
          license
        });
      } catch (error) {
        res.status(400).json({ 
          message: error.message,
          license
        });
      }
    } catch (error) {
      console.error("Error activating license:", error);
      res.status(500).json({ 
        message: "Error activating license", 
        error: error.message 
      });
    }
  });
  
  app.post('/api/license/deactivate', isAuthenticated, async (req, res) => {
    try {
      const { licenseId } = req.body;
      
      if (!licenseId) {
        return res.status(400).json({ message: "License ID is required" });
      }
      
      // Get the license
      const license = await storage.getLicenseKey(licenseId);
      
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      
      // Get device information
      const deviceId = req.headers['x-device-id'] || req.cookies.deviceId || 'unknown-device';
      
      // Deactivate the license on this device
      const activation = await storage.deactivateLicenseOnDevice(licenseId, deviceId);
      
      if (activation) {
        // Log the deactivation for security audit
        await storage.addSecurityLog({
          userId: req.user.id,
          event: 'license_deactivated',
          details: { licenseId, activationId: activation.id },
          severity: 'info',
          deviceId
        });
        
        res.json({
          message: "License deactivated successfully",
          activation
        });
      } else {
        res.status(404).json({
          message: "License not activated on this device"
        });
      }
    } catch (error) {
      console.error("Error deactivating license:", error);
      res.status(500).json({ 
        message: "Error deactivating license", 
        error: error.message 
      });
    }
  });
  
  app.post('/api/license/verify', async (req, res) => {
    try {
      const { licenseKey } = req.body;
      
      if (!licenseKey) {
        return res.status(400).json({ message: "License key is required" });
      }
      
      // Get device information
      const deviceId = req.headers['x-device-id'] || req.cookies.deviceId || 'unknown-device';
      
      // Check the license status
      const status = await storage.checkLicenseStatus(licenseKey, deviceId);
      
      res.json(status);
    } catch (error) {
      console.error("Error verifying license:", error);
      res.status(500).json({ 
        message: "Error verifying license", 
        error: error.message 
      });
    }
  });

  // File Integrity monitoring endpoints
  app.post('/api/integrity/scan', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      // Register all files for integrity checking
      const result = await fileMonitor.registerAllFiles();
      res.json({
        message: "File integrity scan completed",
        result
      });
    } catch (error) {
      console.error("Error scanning files:", error);
      res.status(500).json({
        message: "Error scanning files for integrity",
        error: error.message
      });
    }
  });

  app.get('/api/integrity/verify', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      // Verify all registered files
      const result = await fileMonitor.verifyAllFiles();
      res.json({
        message: "File integrity verification completed",
        result
      });
    } catch (error) {
      console.error("Error verifying files:", error);
      res.status(500).json({
        message: "Error verifying file integrity",
        error: error.message
      });
    }
  });

  app.get('/api/integrity/deleted', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      const report = await fileMonitor.getDeletedFilesReport();
      res.json({
        message: "Deleted files report",
        report
      });
    } catch (error) {
      console.error("Error getting deleted files report:", error);
      res.status(500).json({
        message: "Error getting deleted files report",
        error: error.message
      });
    }
  });

  app.get('/api/integrity/modified', isAuthenticated, ensureValidDevice, async (req, res) => {
    try {
      const report = await fileMonitor.getModifiedFilesReport();
      res.json({
        message: "Modified files report",
        report
      });
    } catch (error) {
      console.error("Error getting modified files report:", error);
      res.status(500).json({
        message: "Error getting modified files report",
        error: error.message
      });
    }
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      console.log('Received:', message);
      
      // Echo the message back for testing
      if (ws.readyState === 1) { // WebSocket.OPEN is 1
        ws.send(`Echo: ${message}`);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to quantum blockchain DRM system'
    }));
  });

  return httpServer;
}

module.exports = { registerRoutes };