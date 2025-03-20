const { db } = require('./db');
const { eq, and } = require('drizzle-orm');
const schema = require('../shared/schema');

// Storage interface for database operations
class DatabaseStorage {
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
}

// Export the storage interface
const storage = new DatabaseStorage();
module.exports = { storage };