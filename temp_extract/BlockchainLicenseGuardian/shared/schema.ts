import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  securitySettings: jsonb("security_settings").default({
    blockRemoteConnections: true,
    notifyNewDevices: true,
    enforceQuantumSecurity: true,
    autoBlacklistSuspicious: true
  }),
  metadata: jsonb("metadata").default({
    trustScore: 0.5,
    lastLoginAt: null,
    restrictedLocations: [],
    deviceCount: 0
  }),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  securitySettings: true,
});

// Digital asset schema
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., "document", "software", "music"
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertAssetSchema = createInsertSchema(assets).pick({
  name: true,
  type: true,
  status: true,
  metadata: true,
});

// License schema
export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  licenseCode: text("license_code").notNull().unique(),
  assetId: integer("asset_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("active"), // active, expiring, revoked
  issuedAt: timestamp("issued_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
});

export const insertLicenseSchema = createInsertSchema(licenses).pick({
  licenseCode: true,
  assetId: true,
  userId: true,
  status: true,
  expiresAt: true,
  metadata: true,
});

// Blockchain ledger entry schema
export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  assetId: integer("asset_id"),
  licenseId: integer("license_id"),
  action: text("action").notNull(), // e.g., "license_creation", "license_verification", "access_attempt"
  status: text("status").notNull(), // e.g., "verified", "rejected", "confirmed"
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).pick({
  transactionId: true,
  assetId: true,
  licenseId: true,
  action: true,
  status: true,
  metadata: true,
});

// AI violation detection schema
export const violations = pgTable("violations", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id"),
  licenseId: integer("license_id"),
  type: text("type").notNull(), // e.g., "duplication", "suspicious_pattern", "unauthorized_access"
  severity: text("severity").notNull(), // "low", "medium", "high"
  timestamp: timestamp("timestamp").defaultNow(),
  isResolved: boolean("is_resolved").default(false),
  metadata: jsonb("metadata"),
});

export const insertViolationSchema = createInsertSchema(violations).pick({
  assetId: true,
  licenseId: true,
  type: true,
  severity: true,
  isResolved: true,
  metadata: true,
});

// System statistics schema
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  activeLicenses: integer("active_licenses").default(0),
  ledgerEntries: integer("ledger_entries").default(0),
  protectedAssets: integer("protected_assets").default(0),
  violationAttempts: integer("violation_attempts").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertStatisticsSchema = createInsertSchema(statistics).pick({
  activeLicenses: true,
  ledgerEntries: true,
  protectedAssets: true,
  violationAttempts: true,
});

// User devices schema for tracking connected devices
export const userDevices = pgTable("user_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  deviceId: text("device_id").notNull(),
  fingerprint: text("fingerprint").notNull(),
  deviceName: text("device_name").notNull().default("Unknown Device"),
  trustScore: integer("trust_score").notNull().default(50),
  isBlacklisted: boolean("is_blacklisted").default(false),
  isCurrentDevice: boolean("is_current_device").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  firstSeen: timestamp("first_seen").defaultNow(),
  metadata: jsonb("metadata").default({
    isRemote: false,
    connectionType: "direct",
    operatingSystem: "unknown",
    browser: "unknown",
    anomalyScore: 0
  }),
});

export const insertUserDeviceSchema = createInsertSchema(userDevices).pick({
  userId: true,
  deviceId: true,
  fingerprint: true,
  deviceName: true,
  trustScore: true,
  isBlacklisted: true,
  isCurrentDevice: true,
  metadata: true,
});

// User security notifications schema
export const securityNotifications = pgTable("security_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"), // info, warning, critical
  type: text("type").notNull(), // new_device, remote_access, suspicious_activity, blacklist
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertSecurityNotificationSchema = createInsertSchema(securityNotifications).pick({
  userId: true,
  title: true,
  message: true,
  severity: true,
  type: true,
  isRead: true,
  isArchived: true,
  metadata: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;

export type Violation = typeof violations.$inferSelect;
export type InsertViolation = z.infer<typeof insertViolationSchema>;

export type Statistics = typeof statistics.$inferSelect;
export type InsertStatistics = z.infer<typeof insertStatisticsSchema>;

export type UserDevice = typeof userDevices.$inferSelect;
export type InsertUserDevice = z.infer<typeof insertUserDeviceSchema>;

export type SecurityNotification = typeof securityNotifications.$inferSelect;
export type InsertSecurityNotification = z.infer<typeof insertSecurityNotificationSchema>;

// Code Immutability Records schema
export const codeImmutabilityRecords = pgTable("code_immutability_records", {
  id: serial("id").primaryKey(),
  fileHash: text("file_hash").notNull(),
  filePath: text("file_path").notNull().unique(),
  timestamp: timestamp("timestamp").defaultNow(),
  blockchainTxId: text("blockchain_tx_id").notNull(),
  status: text("status").notNull().default("permanent_record"), // verified, tampered, pending_verification, permanent_record
  verificationCount: integer("verification_count").default(1),
  lastVerified: timestamp("last_verified").defaultNow(),
  permanentNodes: integer("permanent_nodes").default(15000),
  quantumSignature: text("quantum_signature").notNull(),
  cannotBeDeleted: boolean("cannot_be_deleted").default(true),
  copyright: jsonb("copyright").notNull().default({
    owner: "Ervin Remus Radosavlevici",
    contactEmail: ["ervin210@sky.com", "ervin210@icloud.com"],
    registrationDate: new Date(),
    licenseType: "All Rights Reserved",
    verified: true
  }),
});

export const insertCodeImmutabilityRecordSchema = createInsertSchema(codeImmutabilityRecords).pick({
  fileHash: true,
  filePath: true,
  blockchainTxId: true,
  status: true,
  verificationCount: true,
  lastVerified: true,
  permanentNodes: true,
  quantumSignature: true,
  cannotBeDeleted: true,
  copyright: true,
});

export type CodeImmutabilityRecord = typeof codeImmutabilityRecords.$inferSelect;
export type InsertCodeImmutabilityRecord = z.infer<typeof insertCodeImmutabilityRecordSchema>;
