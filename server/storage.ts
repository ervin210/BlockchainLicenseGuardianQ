const { db } = require('./db');
const { eq, and } = require('drizzle-orm');
const schema = require('../shared/schema');
const crypto = require('crypto');

// Storage interface for database operations
class DatabaseStorage {
  // License key generation helper method
  generateLicenseKey(length = 24) {
    return crypto.randomBytes(length).toString('hex').toUpperCase();
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user || undefined;
  }

  async createUser(insertUser) {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  // Immutability operations
  async getImmutabilityRecord(id) {
    const [record] = await db.select().from(schema.immutabilityRecords)
      .where(eq(schema.immutabilityRecords.id, id));
    return record || undefined;
  }

  async getImmutabilityRecordByHash(codeHash) {
    const [record] = await db.select().from(schema.immutabilityRecords)
      .where(eq(schema.immutabilityRecords.codeHash, codeHash));
    return record || undefined;
  }

  async createImmutabilityRecord(recordData) {
    const [record] = await db.insert(schema.immutabilityRecords)
      .values(recordData).returning();
    return record;
  }

  async verifyImmutabilityRecord(id, blockchainTxId) {
    const [record] = await db.update(schema.immutabilityRecords)
      .set({ 
        blockchainTxId, 
        status: 'verified', 
        lastVerified: new Date() 
      })
      .where(eq(schema.immutabilityRecords.id, id))
      .returning();
    return record;
  }

  async getImmutabilityRecords(userId, limit = 50) {
    return await db.select().from(schema.immutabilityRecords)
      .where(eq(schema.immutabilityRecords.userId, userId))
      .limit(limit)
      .orderBy(schema.immutabilityRecords.createdAt);
  }

  // Security logs operations
  async addSecurityLog(logData) {
    const [log] = await db.insert(schema.securityLogs)
      .values(logData).returning();
    return log;
  }

  async getSecurityLogs(userId, limit = 50) {
    return await db.select().from(schema.securityLogs)
      .where(eq(schema.securityLogs.userId, userId))
      .limit(limit)
      .orderBy(schema.securityLogs.createdAt);
  }

  // Access control operations
  async addAccessControl(controlData) {
    const [control] = await db.insert(schema.accessControl)
      .values(controlData).returning();
    return control;
  }

  async removeAccessControl(id) {
    const [result] = await db.delete(schema.accessControl)
      .where(eq(schema.accessControl.id, id))
      .returning();
    return result;
  }

  async getAccessControl(userId, resourceId) {
    const [control] = await db.select().from(schema.accessControl)
      .where(and(
        eq(schema.accessControl.userId, userId),
        eq(schema.accessControl.resourceId, resourceId)
      ));
    return control || undefined;
  }
  
  // File integrity operations
  async addFileIntegrity(fileData) {
    const [file] = await db.insert(schema.fileIntegrity)
      .values(fileData).returning();
    return file;
  }
  
  async updateFileIntegrity(filePath, fileData) {
    const [file] = await db.update(schema.fileIntegrity)
      .set({ 
        ...fileData,
        updatedAt: new Date()
      })
      .where(eq(schema.fileIntegrity.filePath, filePath))
      .returning();
    return file;
  }
  
  async getFileIntegrity(filePath) {
    const [file] = await db.select().from(schema.fileIntegrity)
      .where(eq(schema.fileIntegrity.filePath, filePath));
    return file || undefined;
  }
  
  async getAllFiles(limit = 1000) {
    return await db.select().from(schema.fileIntegrity)
      .limit(limit)
      .orderBy(schema.fileIntegrity.filePath);
  }
  
  async getDeletedFiles() {
    return await db.select().from(schema.fileIntegrity)
      .where(eq(schema.fileIntegrity.status, 'deleted'));
  }
  
  async getModifiedFiles() {
    return await db.select().from(schema.fileIntegrity)
      .where(eq(schema.fileIntegrity.status, 'modified'));
  }
  
  async markFileAsDeleted(filePath) {
    const [file] = await db.update(schema.fileIntegrity)
      .set({ 
        status: 'deleted',
        updatedAt: new Date()
      })
      .where(eq(schema.fileIntegrity.filePath, filePath))
      .returning();
    return file;
  }
  
  async markFileAsModified(filePath, newHash, newSize) {
    const [file] = await db.update(schema.fileIntegrity)
      .set({ 
        status: 'modified',
        fileHash: newHash,
        size: newSize,
        lastModified: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.fileIntegrity.filePath, filePath))
      .returning();
    return file;
  }

  // License key operations
  async createLicenseKey(licenseData) {
    // Generate a new license key if not provided
    if (!licenseData.licenseKey) {
      licenseData.licenseKey = this.generateLicenseKey();
    }
    
    const [license] = await db.insert(schema.licenseKeys)
      .values(licenseData).returning();
    return license;
  }

  async getLicenseKey(id) {
    const [license] = await db.select().from(schema.licenseKeys)
      .where(eq(schema.licenseKeys.id, id));
    return license || undefined;
  }

  async getLicenseKeyByCode(licenseKey) {
    const [license] = await db.select().from(schema.licenseKeys)
      .where(eq(schema.licenseKeys.licenseKey, licenseKey));
    return license || undefined;
  }

  async getUserLicenses(userId) {
    return await db.select().from(schema.licenseKeys)
      .where(eq(schema.licenseKeys.userId, userId))
      .orderBy(schema.licenseKeys.createdAt);
  }

  async updateLicenseKey(id, updateData) {
    const [license] = await db.update(schema.licenseKeys)
      .set({ 
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(schema.licenseKeys.id, id))
      .returning();
    return license;
  }

  async deactivateLicense(id) {
    const [license] = await db.update(schema.licenseKeys)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(schema.licenseKeys.id, id))
      .returning();
    return license;
  }

  // License activation operations
  async activateLicense(activationData) {
    // Check if license still has activations available
    const license = await this.getLicenseKey(activationData.licenseId);
    
    if (!license || !license.isActive) {
      throw new Error('License is inactive or does not exist');
    }
    
    const activationsLeft = license.activationsLeft || 0;
    if (activationsLeft <= 0) {
      throw new Error('No activations left for this license');
    }
    
    // Create the activation record
    const [activation] = await db.insert(schema.licenseActivations)
      .values(activationData).returning();
    
    // Decrement the available activations
    const currentActivations = license.activationsLeft || 0;
    await this.updateLicenseKey(license.id, {
      activationsLeft: Math.max(0, currentActivations - 1)
    });
    
    return activation;
  }

  async getLicenseActivations(licenseId) {
    return await db.select().from(schema.licenseActivations)
      .where(eq(schema.licenseActivations.licenseId, licenseId))
      .orderBy(schema.licenseActivations.activatedAt);
  }

  async deactivateLicenseOnDevice(licenseId, deviceId) {
    const [activation] = await db.update(schema.licenseActivations)
      .set({ 
        isActive: false,
        lastCheckedAt: new Date()
      })
      .where(and(
        eq(schema.licenseActivations.licenseId, licenseId),
        eq(schema.licenseActivations.deviceId, deviceId)
      ))
      .returning();
    
    // If deactivation successful, increment available activations
    if (activation) {
      const license = await this.getLicenseKey(licenseId);
      if (license) {
        await this.updateLicenseKey(license.id, {
          activationsLeft: license.activationsLeft + 1
        });
      }
    }
    
    return activation;
  }

  async checkLicenseStatus(licenseKey, deviceId) {
    // Get the license
    const license = await this.getLicenseKeyByCode(licenseKey);
    if (!license || !license.isActive) {
      return { valid: false, reason: 'License inactive or not found' };
    }
    
    // Check expiration if set
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return { valid: false, reason: 'License expired' };
    }
    
    // Check activation on this device
    const [activation] = await db.select().from(schema.licenseActivations)
      .where(and(
        eq(schema.licenseActivations.licenseId, license.id),
        eq(schema.licenseActivations.deviceId, deviceId),
        eq(schema.licenseActivations.isActive, true)
      ));
    
    // Update last checked time if active
    if (activation) {
      await db.update(schema.licenseActivations)
        .set({ lastCheckedAt: new Date() })
        .where(eq(schema.licenseActivations.id, activation.id));
      
      return { 
        valid: true, 
        license,
        activation
      };
    }
    
    // Check if activations available
    if (license.activationsLeft > 0) {
      return { 
        valid: false, 
        reason: 'Not activated on this device',
        canActivate: true,
        license
      };
    }
    
    return { 
      valid: false, 
      reason: 'No activations available',
      license
    };
  }
}

// Export the storage interface
const storage = new DatabaseStorage();

module.exports = { storage };