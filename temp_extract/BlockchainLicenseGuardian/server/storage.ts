import {
  users, type User, type InsertUser,
  assets, type Asset, type InsertAsset,
  licenses, type License, type InsertLicense,
  ledgerEntries, type LedgerEntry, type InsertLedgerEntry,
  violations, type Violation, type InsertViolation,
  statistics, type Statistics, type InsertStatistics,
  userDevices, type UserDevice, type InsertUserDevice,
  securityNotifications, type SecurityNotification, type InsertSecurityNotification,
  codeImmutabilityRecords, type CodeImmutabilityRecord, type InsertCodeImmutabilityRecord
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  updateUserSecuritySettings(userId: number, settings: Partial<any>): Promise<User | undefined>;

  // Asset methods
  getAsset(id: number): Promise<Asset | undefined>;
  getAssets(): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<Asset>): Promise<Asset | undefined>;

  // License methods
  getLicense(id: number): Promise<License | undefined>;
  getLicenses(): Promise<License[]>;
  getLicensesByAsset(assetId: number): Promise<License[]>;
  getLicensesByUser(userId: number): Promise<License[]>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: number, license: Partial<License>): Promise<License | undefined>;

  // Ledger methods
  getLedgerEntry(id: number): Promise<LedgerEntry | undefined>;
  getLedgerEntries(limit?: number): Promise<LedgerEntry[]>;
  createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;

  // Violation methods
  getViolation(id: number): Promise<Violation | undefined>;
  getViolations(): Promise<Violation[]>;
  createViolation(violation: InsertViolation): Promise<Violation>;
  updateViolation(id: number, violation: Partial<Violation>): Promise<Violation | undefined>;

  // Statistics methods
  getStatistics(): Promise<Statistics>;
  updateStatistics(stats: Partial<Statistics>): Promise<Statistics>;
  
  // User Devices methods
  getUserDevices(userId: number): Promise<UserDevice[]>;
  getUserDevice(id: number): Promise<UserDevice | undefined>;
  getUserDeviceByFingerprint(userId: number, fingerprint: string): Promise<UserDevice | undefined>;
  createUserDevice(device: InsertUserDevice): Promise<UserDevice>;
  updateUserDevice(id: number, device: Partial<UserDevice>): Promise<UserDevice | undefined>;
  blacklistUserDevice(id: number, reason: string): Promise<UserDevice | undefined>;
  removeUserDeviceBlacklist(id: number): Promise<UserDevice | undefined>;
  
  // Security Notifications methods
  getSecurityNotifications(userId: number, unreadOnly?: boolean): Promise<SecurityNotification[]>;
  createSecurityNotification(notification: InsertSecurityNotification): Promise<SecurityNotification>;
  markNotificationAsRead(id: number): Promise<SecurityNotification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  archiveNotification(id: number): Promise<SecurityNotification | undefined>;
  
  // Code Immutability Records methods
  getCodeImmutabilityRecord(id: number): Promise<CodeImmutabilityRecord | undefined>;
  getCodeImmutabilityRecordByPath(filePath: string): Promise<CodeImmutabilityRecord | undefined>;
  getCodeImmutabilityRecords(): Promise<CodeImmutabilityRecord[]>;
  createCodeImmutabilityRecord(record: InsertCodeImmutabilityRecord): Promise<CodeImmutabilityRecord>;
  updateCodeImmutabilityRecord(id: number, updates: Partial<CodeImmutabilityRecord>): Promise<CodeImmutabilityRecord | undefined>;
  verifyCodeImmutability(filePath: string, fileHash: string): Promise<{verified: boolean; record?: CodeImmutabilityRecord}>;
}

export class MemStorage implements IStorage {
  public sessionStore: session.Store;
  private users: Map<number, User>;
  private assets: Map<number, Asset>;
  private licenses: Map<number, License>;
  private ledgerEntries: Map<number, LedgerEntry>;
  private violations: Map<number, Violation>;
  private statistics: Statistics;
  private userDevices: Map<number, UserDevice>;
  private securityNotifications: Map<number, SecurityNotification>;
  
  private userIdCounter: number;
  private assetIdCounter: number;
  private licenseIdCounter: number;
  private ledgerIdCounter: number;
  private violationIdCounter: number;
  private userDeviceIdCounter: number;
  private securityNotificationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.assets = new Map();
    this.licenses = new Map();
    this.ledgerEntries = new Map();
    this.violations = new Map();
    this.userDevices = new Map();
    this.securityNotifications = new Map();
    
    this.userIdCounter = 1;
    this.assetIdCounter = 1;
    this.licenseIdCounter = 1;
    this.ledgerIdCounter = 1;
    this.violationIdCounter = 1;
    this.userDeviceIdCounter = 1;
    this.securityNotificationIdCounter = 1;
    
    // Initialize session store with enhanced configuration
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 3600000, // Check expired sessions every hour instead of day
      ttl: 1000 * 60 * 60 * 24, // 24 hour session lifetime
      stale: false // Don't return stale sessions
    });
    
    // Initialize with default statistics
    this.statistics = {
      id: 1,
      activeLicenses: 248,
      ledgerEntries: 1247,
      protectedAssets: 782,
      violationAttempts: 18,
      lastUpdated: new Date()
    };

    // Seed initial data
    this.seedInitialData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user", // Ensure role is never undefined
      createdAt: new Date(),
      securitySettings: {
        blockRemoteConnections: true,
        notifyNewDevices: true,
        enforceQuantumSecurity: true,
        autoBlacklistSuspicious: true
      }
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userData
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }

  // Asset methods
  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assets.get(id);
  }

  async getAssets(): Promise<Asset[]> {
    return Array.from(this.assets.values());
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.assetIdCounter++;
    const now = new Date();
    const asset: Asset = {
      ...insertAsset,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.assets.set(id, asset);
    await this.updateStatistics({ protectedAssets: this.statistics.protectedAssets + 1 });
    return asset;
  }

  async updateAsset(id: number, assetUpdate: Partial<Asset>): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;
    
    const updatedAsset: Asset = {
      ...asset,
      ...assetUpdate,
      updatedAt: new Date()
    };
    
    this.assets.set(id, updatedAsset);
    return updatedAsset;
  }

  // License methods
  async getLicense(id: number): Promise<License | undefined> {
    return this.licenses.get(id);
  }

  async getLicenses(): Promise<License[]> {
    return Array.from(this.licenses.values());
  }

  async getLicensesByAsset(assetId: number): Promise<License[]> {
    return Array.from(this.licenses.values()).filter(
      (license) => license.assetId === assetId
    );
  }

  async getLicensesByUser(userId: number): Promise<License[]> {
    return Array.from(this.licenses.values()).filter(
      (license) => license.userId === userId
    );
  }

  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const id = this.licenseIdCounter++;
    const license: License = {
      ...insertLicense,
      id,
      issuedAt: new Date()
    };
    this.licenses.set(id, license);
    await this.updateStatistics({ activeLicenses: this.statistics.activeLicenses + 1 });
    return license;
  }

  async updateLicense(id: number, licenseUpdate: Partial<License>): Promise<License | undefined> {
    const license = this.licenses.get(id);
    if (!license) return undefined;
    
    const updatedLicense: License = {
      ...license,
      ...licenseUpdate
    };
    
    this.licenses.set(id, updatedLicense);
    return updatedLicense;
  }

  // Ledger methods
  async getLedgerEntry(id: number): Promise<LedgerEntry | undefined> {
    return this.ledgerEntries.get(id);
  }

  async getLedgerEntries(limit?: number): Promise<LedgerEntry[]> {
    const entries = Array.from(this.ledgerEntries.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    
    return limit ? entries.slice(0, limit) : entries;
  }

  async createLedgerEntry(insertEntry: InsertLedgerEntry): Promise<LedgerEntry> {
    const id = this.ledgerIdCounter++;
    const entry: LedgerEntry = {
      ...insertEntry,
      id,
      timestamp: new Date()
    };
    this.ledgerEntries.set(id, entry);
    await this.updateStatistics({ ledgerEntries: this.statistics.ledgerEntries + 1 });
    return entry;
  }

  // Violation methods
  async getViolation(id: number): Promise<Violation | undefined> {
    return this.violations.get(id);
  }

  async getViolations(): Promise<Violation[]> {
    return Array.from(this.violations.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async createViolation(insertViolation: InsertViolation): Promise<Violation> {
    const id = this.violationIdCounter++;
    const violation: Violation = {
      ...insertViolation,
      id,
      timestamp: new Date()
    };
    this.violations.set(id, violation);
    await this.updateStatistics({ violationAttempts: this.statistics.violationAttempts + 1 });
    return violation;
  }

  async updateViolation(id: number, violationUpdate: Partial<Violation>): Promise<Violation | undefined> {
    const violation = this.violations.get(id);
    if (!violation) return undefined;
    
    const updatedViolation: Violation = {
      ...violation,
      ...violationUpdate
    };
    
    this.violations.set(id, updatedViolation);
    return updatedViolation;
  }

  // Statistics methods
  async getStatistics(): Promise<Statistics> {
    return this.statistics;
  }

  async updateStatistics(statsUpdate: Partial<Statistics>): Promise<Statistics> {
    this.statistics = {
      ...this.statistics,
      ...statsUpdate,
      lastUpdated: new Date()
    };
    return this.statistics;
  }
  
  // Security Settings methods
  async updateUserSecuritySettings(userId: number, settings: Partial<any>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    // Create default settings if they don't exist
    const currentSettings = user.securitySettings || {
      blockRemoteConnections: true,
      notifyNewDevices: true,
      enforceQuantumSecurity: true,
      autoBlacklistSuspicious: true
    };
    
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    const updatedUser = {
      ...user,
      securitySettings: updatedSettings
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // User Devices methods
  async getUserDevices(userId: number): Promise<UserDevice[]> {
    return Array.from(this.userDevices.values())
      .filter(device => device.userId === userId)
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }
  
  async getUserDevice(id: number): Promise<UserDevice | undefined> {
    return this.userDevices.get(id);
  }
  
  async getUserDeviceByFingerprint(userId: number, fingerprint: string): Promise<UserDevice | undefined> {
    return Array.from(this.userDevices.values()).find(
      device => device.userId === userId && device.fingerprint === fingerprint
    );
  }
  
  async createUserDevice(device: InsertUserDevice): Promise<UserDevice> {
    const id = this.userDeviceIdCounter++;
    const now = new Date();
    
    const newDevice: UserDevice = {
      ...device,
      id,
      lastSeen: now,
      firstSeen: now
    };
    
    this.userDevices.set(id, newDevice);
    
    // Create notification for new device if user has notifications enabled
    const user = await this.getUser(device.userId);
    if (user?.securitySettings?.notifyNewDevices) {
      await this.createSecurityNotification({
        userId: device.userId,
        title: "New Device Connected",
        message: `A new device "${device.deviceName}" was connected to your account.`,
        severity: "info",
        type: "new_device",
        metadata: { deviceId: id, fingerprint: device.fingerprint }
      });
    }
    
    // Check if device is remote and user has remote blocking enabled
    const isRemote = device.metadata?.isRemote === true;
    if (isRemote && user?.securitySettings?.blockRemoteConnections) {
      // Blacklist the device if it's remote
      await this.blacklistUserDevice(id, "Remote connection automatically blocked by security policy");
      
      // Send notification about blocked remote device
      await this.createSecurityNotification({
        userId: device.userId,
        title: "Remote Connection Blocked",
        message: `A remote connection attempt from device "${device.deviceName}" was blocked by your security settings.`,
        severity: "warning",
        type: "remote_access",
        metadata: { deviceId: id, fingerprint: device.fingerprint }
      });
    }
    
    return newDevice;
  }
  
  async updateUserDevice(id: number, deviceUpdate: Partial<UserDevice>): Promise<UserDevice | undefined> {
    const device = this.userDevices.get(id);
    if (!device) return undefined;
    
    const updatedDevice: UserDevice = {
      ...device,
      ...deviceUpdate,
      lastSeen: new Date()
    };
    
    this.userDevices.set(id, updatedDevice);
    return updatedDevice;
  }
  
  async blacklistUserDevice(id: number, reason: string): Promise<UserDevice | undefined> {
    const device = this.userDevices.get(id);
    if (!device) return undefined;
    
    const updatedDevice: UserDevice = {
      ...device,
      isBlacklisted: true,
      metadata: {
        ...device.metadata as Record<string, any>,
        blacklistReason: reason,
        blacklistedAt: new Date()
      }
    };
    
    this.userDevices.set(id, updatedDevice);
    
    // Create notification for blacklisted device
    await this.createSecurityNotification({
      userId: device.userId,
      title: "Device Blacklisted",
      message: `Device "${device.deviceName}" has been blacklisted: ${reason}`,
      severity: "critical",
      type: "blacklist",
      metadata: { deviceId: id, fingerprint: device.fingerprint, reason }
    });
    
    return updatedDevice;
  }
  
  async removeUserDeviceBlacklist(id: number): Promise<UserDevice | undefined> {
    const device = this.userDevices.get(id);
    if (!device) return undefined;
    
    const metadata = { ...(device.metadata as Record<string, any>) };
    delete metadata.blacklistReason;
    delete metadata.blacklistedAt;
    
    const updatedDevice: UserDevice = {
      ...device,
      isBlacklisted: false,
      metadata
    };
    
    this.userDevices.set(id, updatedDevice);
    
    // Create notification for un-blacklisted device
    await this.createSecurityNotification({
      userId: device.userId,
      title: "Device Unblocked",
      message: `Device "${device.deviceName}" has been removed from the blacklist.`,
      severity: "info",
      type: "blacklist",
      metadata: { deviceId: id, fingerprint: device.fingerprint }
    });
    
    return updatedDevice;
  }
  
  // Security Notifications methods
  async getSecurityNotifications(userId: number, unreadOnly: boolean = false): Promise<SecurityNotification[]> {
    return Array.from(this.securityNotifications.values())
      .filter(notification => 
        notification.userId === userId && 
        (!unreadOnly || !notification.isRead) &&
        !notification.isArchived
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createSecurityNotification(notification: InsertSecurityNotification): Promise<SecurityNotification> {
    const id = this.securityNotificationIdCounter++;
    
    const newNotification: SecurityNotification = {
      ...notification,
      id,
      isRead: false,
      isArchived: false,
      createdAt: new Date()
    };
    
    this.securityNotifications.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<SecurityNotification | undefined> {
    const notification = this.securityNotifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: SecurityNotification = {
      ...notification,
      isRead: true
    };
    
    this.securityNotifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    const notifications = Array.from(this.securityNotifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead);
    
    for (const notification of notifications) {
      this.securityNotifications.set(notification.id, {
        ...notification,
        isRead: true
      });
    }
  }
  
  async archiveNotification(id: number): Promise<SecurityNotification | undefined> {
    const notification = this.securityNotifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: SecurityNotification = {
      ...notification,
      isArchived: true
    };
    
    this.securityNotifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // Seed initial data for testing
  private seedInitialData() {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      role: "admin",
      name: "Admin User"
    });
    
    // Seed some sample user devices
    const createSampleDevice = (deviceId: string, fingerprint: string, deviceName: string, metadata: any = {}) => {
      const id = this.userDeviceIdCounter++;
      const now = new Date();
      const device: UserDevice = {
        id,
        userId: 1, // Admin user
        deviceId,
        fingerprint,
        deviceName,
        trustScore: metadata.trustScore || 85,
        isBlacklisted: metadata.isBlacklisted || false,
        isCurrentDevice: metadata.isCurrentDevice || false,
        lastSeen: now,
        firstSeen: new Date(now.getTime() - 1000 * 60 * 60 * 24 * metadata.daysOld || 0),
        metadata: {
          isRemote: metadata.isRemote || false,
          connectionType: metadata.connectionType || "direct",
          operatingSystem: metadata.operatingSystem || "Windows 10",
          browser: metadata.browser || "Chrome",
          anomalyScore: metadata.anomalyScore || 0,
          ...metadata
        }
      };
      this.userDevices.set(id, device);
      return device;
    };
    
    // Create sample primary device
    createSampleDevice(
      "device-primary-001",
      "fp-chrome-win10-primary",
      "Work Computer",
      {
        trustScore: 95,
        isCurrentDevice: true,
        connectionType: "direct",
        operatingSystem: "Windows 10",
        browser: "Chrome",
        anomalyScore: 0,
        lastLoginLocation: "New York, USA"
      }
    );
    
    // Create sample mobile device
    createSampleDevice(
      "device-mobile-001",
      "fp-safari-ios-mobile",
      "iPhone 13",
      {
        trustScore: 90,
        connectionType: "mobile",
        operatingSystem: "iOS 16",
        browser: "Safari",
        daysOld: 14,
        anomalyScore: 5,
        lastLoginLocation: "New York, USA"
      }
    );
    
    // Create sample remote device (blacklisted)
    const remoteDevice = createSampleDevice(
      "device-remote-001",
      "fp-firefox-linux-remote",
      "Unknown Linux",
      {
        trustScore: 15,
        isBlacklisted: true,
        isRemote: true,
        connectionType: "remote",
        operatingSystem: "Linux",
        browser: "Firefox",
        daysOld: 2,
        anomalyScore: 85,
        lastLoginLocation: "Unknown Location",
        blacklistReason: "Remote connection automatically blocked by security policy",
        blacklistedAt: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
      }
    );
    
    // Create some sample security notifications
    const createSampleNotification = (
      title: string, 
      message: string, 
      severity: string, 
      type: string, 
      metadata: any = {},
      isRead: boolean = false
    ) => {
      const id = this.securityNotificationIdCounter++;
      const notification: SecurityNotification = {
        id,
        userId: 1, // Admin user
        title,
        message,
        severity,
        type,
        isRead,
        isArchived: false,
        createdAt: new Date(Date.now() - metadata.minutesAgo * 60 * 1000 || 0),
        metadata
      };
      this.securityNotifications.set(id, notification);
    };
    
    // New device notification
    createSampleNotification(
      "New Device Connected",
      "A new device \"iPhone 13\" was connected to your account.",
      "info",
      "new_device",
      { 
        deviceId: 2, 
        fingerprint: "fp-safari-ios-mobile",
        minutesAgo: 20160 // 14 days ago
      },
      true // read
    );
    
    // Remote connection blocked notification
    createSampleNotification(
      "Remote Connection Blocked",
      "A remote connection attempt from device \"Unknown Linux\" was blocked by your security settings.",
      "warning",
      "remote_access",
      { 
        deviceId: remoteDevice.id, 
        fingerprint: "fp-firefox-linux-remote",
        minutesAgo: 300 // 5 hours ago
      }
    );
    
    // Suspicious activity notification
    createSampleNotification(
      "Suspicious Login Attempt",
      "We detected a suspicious login attempt from an unfamiliar location. The attempt was blocked.",
      "critical",
      "suspicious_activity",
      { 
        location: "Moscow, Russia",
        ipAddress: "198.51.100.42",
        minutesAgo: 180 // 3 hours ago
      }
    );

    // Create some assets
    this.createAsset({
      name: "Digital Publication #42",
      type: "document",
      status: "active",
      metadata: { format: "pdf", size: "12MB" }
    });

    this.createAsset({
      name: "Software Product #87",
      type: "software",
      status: "active",
      metadata: { platform: "cross-platform", version: "2.1.0" }
    });

    this.createAsset({
      name: "Music Track #129",
      type: "music",
      status: "active",
      metadata: { format: "mp3", duration: "3:45" }
    });

    // Create some licenses
    const expiresInDays = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    };

    this.createLicense({
      licenseCode: "L-2023-06-291",
      assetId: 2,
      userId: 1,
      status: "active",
      expiresAt: expiresInDays(342),
      metadata: { licensee: "User Corp Inc." }
    });

    this.createLicense({
      licenseCode: "L-2023-05-189",
      assetId: 1,
      userId: 1,
      status: "expiring",
      expiresAt: expiresInDays(14),
      metadata: { licensee: "Media Company LLC" }
    });

    this.createLicense({
      licenseCode: "L-2023-04-079",
      assetId: 3,
      userId: 1,
      status: "revoked",
      expiresAt: expiresInDays(-10),
      metadata: { licensee: "Individual User", revocationReason: "Terms violation" }
    });

    // Create some ledger entries
    this.createLedgerEntry({
      transactionId: "0x7f3d8a2e51fe85c2f4abc938e42ec7f4b7c244e2",
      assetId: 1,
      licenseId: 2,
      action: "license_verification",
      status: "verified",
      metadata: { verificationMethod: "blockchain" }
    });

    this.createLedgerEntry({
      transactionId: "0x9a1b5c3d7e2f49a63b5e8c4d2a3f6b7c8d9e0f1",
      assetId: 2,
      licenseId: 1,
      action: "access_grant",
      status: "verified",
      metadata: { accessType: "api" }
    });

    this.createLedgerEntry({
      transactionId: "0x2c4e6f8a0b2d4e6f8a0b2d4e6f8a0b2d4e6f8a0b",
      assetId: 3,
      licenseId: 3,
      action: "license_creation",
      status: "confirmed",
      metadata: { issuer: "admin" }
    });

    this.createLedgerEntry({
      transactionId: "0x5d7e9f1b3c5a7e9d1f3b5a7e9d1f3b5a7e9d1f3b",
      assetId: 1,
      licenseId: null,
      action: "access_attempt",
      status: "rejected",
      metadata: { reason: "invalid_license" }
    });

    this.createLedgerEntry({
      transactionId: "0xb3c5d7e9f1b3c5d7e9f1b3c5d7e9f1b3c5d7e9f1",
      assetId: 2,
      licenseId: 1,
      action: "license_transfer",
      status: "verified",
      metadata: { previousOwner: "olduser", newOwner: "User Corp Inc." }
    });

    // Create some violations
    this.createViolation({
      assetId: 1,
      licenseId: 2,
      type: "duplication",
      severity: "high",
      isResolved: false,
      metadata: { detectionMethod: "simultaneous_access", locations: ["US", "China"] }
    });

    this.createViolation({
      assetId: 2,
      licenseId: 1,
      type: "suspicious_pattern",
      severity: "medium",
      isResolved: false,
      metadata: { detectionMethod: "api_frequency", threshold: "exceeded 200%" }
    });
  }

  // Code Immutability Records methods - stub implementations for MemStorage
  async getCodeImmutabilityRecord(id: number): Promise<CodeImmutabilityRecord | undefined> {
    return undefined; // Not implemented in memory storage
  }

  async getCodeImmutabilityRecordByPath(filePath: string): Promise<CodeImmutabilityRecord | undefined> {
    return undefined; // Not implemented in memory storage
  }

  async getCodeImmutabilityRecords(): Promise<CodeImmutabilityRecord[]> {
    return []; // Not implemented in memory storage
  }

  async createCodeImmutabilityRecord(record: InsertCodeImmutabilityRecord): Promise<CodeImmutabilityRecord> {
    throw new Error("Code immutability records must be stored in the database. Use DatabaseStorage."); 
  }

  async updateCodeImmutabilityRecord(id: number, updates: Partial<CodeImmutabilityRecord>): Promise<CodeImmutabilityRecord | undefined> {
    throw new Error("Code immutability records must be stored in the database. Use DatabaseStorage.");
  }

  async verifyCodeImmutability(filePath: string, fileHash: string): Promise<{verified: boolean; record?: CodeImmutabilityRecord}> {
    throw new Error("Code immutability verification must use the database. Use DatabaseStorage.");
  }
}


// DatabaseStorage class for permanent storage of immutability records
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  private memStorage: MemStorage;

  constructor() {
    // Initialize PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Use MemStorage for everything except code immutability records
    this.memStorage = new MemStorage();
  }

  // User methods (delegated to MemStorage)
  async getUser(id: number): Promise<User | undefined> {
    return this.memStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.memStorage.getUserByUsername(username);
  }

  async getUsers(): Promise<User[]> {
    return this.memStorage.getUsers();
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.memStorage.createUser(user);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    return this.memStorage.updateUser(id, userData);
  }

  async deleteUser(id: number): Promise<void> {
    return this.memStorage.deleteUser(id);
  }

  async updateUserSecuritySettings(userId: number, settings: Partial<any>): Promise<User | undefined> {
    return this.memStorage.updateUserSecuritySettings(userId, settings);
  }

  // Asset methods (delegated to MemStorage)
  async getAsset(id: number): Promise<Asset | undefined> {
    return this.memStorage.getAsset(id);
  }

  async getAssets(): Promise<Asset[]> {
    return this.memStorage.getAssets();
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    return this.memStorage.createAsset(asset);
  }

  async updateAsset(id: number, asset: Partial<Asset>): Promise<Asset | undefined> {
    return this.memStorage.updateAsset(id, asset);
  }

  // License methods (delegated to MemStorage)
  async getLicense(id: number): Promise<License | undefined> {
    return this.memStorage.getLicense(id);
  }

  async getLicenses(): Promise<License[]> {
    return this.memStorage.getLicenses();
  }

  async getLicensesByAsset(assetId: number): Promise<License[]> {
    return this.memStorage.getLicensesByAsset(assetId);
  }

  async getLicensesByUser(userId: number): Promise<License[]> {
    return this.memStorage.getLicensesByUser(userId);
  }

  async createLicense(license: InsertLicense): Promise<License> {
    return this.memStorage.createLicense(license);
  }

  async updateLicense(id: number, license: Partial<License>): Promise<License | undefined> {
    return this.memStorage.updateLicense(id, license);
  }

  // Ledger methods (delegated to MemStorage)
  async getLedgerEntry(id: number): Promise<LedgerEntry | undefined> {
    return this.memStorage.getLedgerEntry(id);
  }

  async getLedgerEntries(limit?: number): Promise<LedgerEntry[]> {
    return this.memStorage.getLedgerEntries(limit);
  }

  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> {
    return this.memStorage.createLedgerEntry(entry);
  }

  // Violation methods (delegated to MemStorage)
  async getViolation(id: number): Promise<Violation | undefined> {
    return this.memStorage.getViolation(id);
  }

  async getViolations(): Promise<Violation[]> {
    return this.memStorage.getViolations();
  }

  async createViolation(violation: InsertViolation): Promise<Violation> {
    return this.memStorage.createViolation(violation);
  }

  async updateViolation(id: number, violation: Partial<Violation>): Promise<Violation | undefined> {
    return this.memStorage.updateViolation(id, violation);
  }

  // Statistics methods (delegated to MemStorage)
  async getStatistics(): Promise<Statistics> {
    return this.memStorage.getStatistics();
  }

  async updateStatistics(stats: Partial<Statistics>): Promise<Statistics> {
    return this.memStorage.updateStatistics(stats);
  }

  // User Devices methods (delegated to MemStorage)
  async getUserDevices(userId: number): Promise<UserDevice[]> {
    return this.memStorage.getUserDevices(userId);
  }

  async getUserDevice(id: number): Promise<UserDevice | undefined> {
    return this.memStorage.getUserDevice(id);
  }

  async getUserDeviceByFingerprint(userId: number, fingerprint: string): Promise<UserDevice | undefined> {
    return this.memStorage.getUserDeviceByFingerprint(userId, fingerprint);
  }

  async createUserDevice(device: InsertUserDevice): Promise<UserDevice> {
    return this.memStorage.createUserDevice(device);
  }

  async updateUserDevice(id: number, device: Partial<UserDevice>): Promise<UserDevice | undefined> {
    return this.memStorage.updateUserDevice(id, device);
  }

  async blacklistUserDevice(id: number, reason: string): Promise<UserDevice | undefined> {
    return this.memStorage.blacklistUserDevice(id, reason);
  }

  async removeUserDeviceBlacklist(id: number): Promise<UserDevice | undefined> {
    return this.memStorage.removeUserDeviceBlacklist(id);
  }

  // Security Notifications methods (delegated to MemStorage)
  async getSecurityNotifications(userId: number, unreadOnly?: boolean): Promise<SecurityNotification[]> {
    return this.memStorage.getSecurityNotifications(userId, unreadOnly);
  }

  async createSecurityNotification(notification: InsertSecurityNotification): Promise<SecurityNotification> {
    return this.memStorage.createSecurityNotification(notification);
  }

  async markNotificationAsRead(id: number): Promise<SecurityNotification | undefined> {
    return this.memStorage.markNotificationAsRead(id);
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    return this.memStorage.markAllNotificationsAsRead(userId);
  }

  async archiveNotification(id: number): Promise<SecurityNotification | undefined> {
    return this.memStorage.archiveNotification(id);
  }

  // Code Immutability Records methods
  async getCodeImmutabilityRecord(id: number): Promise<CodeImmutabilityRecord | undefined> {
    const [record] = await db.select().from(codeImmutabilityRecords).where(eq(codeImmutabilityRecords.id, id));
    return record || undefined;
  }

  async getCodeImmutabilityRecordByPath(filePath: string): Promise<CodeImmutabilityRecord | undefined> {
    const [record] = await db.select().from(codeImmutabilityRecords).where(eq(codeImmutabilityRecords.filePath, filePath));
    return record || undefined;
  }

  async getCodeImmutabilityRecords(): Promise<CodeImmutabilityRecord[]> {
    return await db.select().from(codeImmutabilityRecords);
  }

  async createCodeImmutabilityRecord(record: InsertCodeImmutabilityRecord): Promise<CodeImmutabilityRecord> {
    const [newRecord] = await db
      .insert(codeImmutabilityRecords)
      .values(record)
      .returning();
    return newRecord;
  }

  async updateCodeImmutabilityRecord(id: number, updates: Partial<CodeImmutabilityRecord>): Promise<CodeImmutabilityRecord | undefined> {
    const [updatedRecord] = await db
      .update(codeImmutabilityRecords)
      .set(updates)
      .where(eq(codeImmutabilityRecords.id, id))
      .returning();
    return updatedRecord || undefined;
  }

  async verifyCodeImmutability(filePath: string, fileHash: string): Promise<{verified: boolean; record?: CodeImmutabilityRecord}> {
    // Get the record if it exists
    const record = await this.getCodeImmutabilityRecordByPath(filePath);
    
    // If no record exists, it's not verified
    if (!record) {
      return { verified: false };
    }
    
    // Check if the hash matches
    const verified = record.fileHash === fileHash;
    
    // Update verification count and last verified timestamp
    if (record.id) {
      await this.updateCodeImmutabilityRecord(record.id, {
        verificationCount: record.verificationCount + 1,
        lastVerified: new Date(),
        status: verified ? 'verified' : 'tampered'
      });
    }
    
    return { verified, record };
  }
}

// Use DatabaseStorage for production to store immutability records in PostgreSQL
export const storage = new DatabaseStorage();
