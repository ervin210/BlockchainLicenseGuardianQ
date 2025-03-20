const { pgTable, serial, text, timestamp, boolean, json, integer, pgEnum } = require("drizzle-orm/pg-core");
const { createInsertSchema } = require("drizzle-zod");
const zod = require("zod");

// User table
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  isActive: boolean("is_active").default(true),
  deviceId: text("device_id"),
  blockchainAddress: text("blockchain_address"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// License Keys table
const licenseKeys = pgTable("license_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  licenseKey: text("license_key").notNull().unique(),
  planType: text("plan_type").notNull(), // standard, premium, enterprise
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  activationsLeft: integer("activations_left").default(1),
  maxActivations: integer("max_activations").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// License Activations table - keeps track of where licenses are activated
const licenseActivations = pgTable("license_activations", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id").notNull().references(() => licenseKeys.id),
  deviceId: text("device_id").notNull(),
  ipAddress: text("ip_address"),
  activatedAt: timestamp("activated_at").defaultNow(),
  lastCheckedAt: timestamp("last_checked_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Permissions enum for access control
const permissionEnum = pgEnum("permission", ["read", "write", "admin"]);

// Code immutability records table - tracks code stored on blockchain
const immutabilityRecords = pgTable("immutability_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  codeHash: text("code_hash").notNull().unique(),
  blockchainTxId: text("blockchain_tx_id"),
  status: text("status").default("pending").notNull(), // pending, verified, tampered
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  lastVerified: timestamp("last_verified"),
});

// Security logs table - tracks security events
const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  event: text("event").notNull(),
  details: json("details").default({}),
  ipAddress: text("ip_address"),
  deviceId: text("device_id"),
  severity: text("severity").notNull(), // info, warning, error, critical
  createdAt: timestamp("created_at").defaultNow(),
});

// Access control table - manages permissions
const accessControl = pgTable("access_control", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  resourceId: text("resource_id").notNull(),
  permission: permissionEnum("permission").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// File integrity table for tracking unauthorized modifications
const fileIntegrity = pgTable("file_integrity", {
  id: serial("id").primaryKey(),
  filePath: text("file_path").notNull().unique(),
  fileHash: text("file_hash").notNull(),
  lastModified: timestamp("last_modified").defaultNow(),
  size: integer("size").notNull(),
  status: text("status").default("valid").notNull(), // valid, modified, deleted
  blockchainTxId: text("blockchain_tx_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas for inserts with Zod validation
const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
const insertImmutabilityRecordSchema = createInsertSchema(immutabilityRecords).omit({ 
  id: true, createdAt: true, lastVerified: true, blockchainTxId: true, status: true 
});
const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({ 
  id: true, createdAt: true 
});
const insertAccessControlSchema = createInsertSchema(accessControl).omit({ 
  id: true, createdAt: true 
});
const insertFileIntegritySchema = createInsertSchema(fileIntegrity).omit({ 
  id: true, createdAt: true, updatedAt: true, blockchainTxId: true, status: true 
});
const insertLicenseKeySchema = createInsertSchema(licenseKeys).omit({
  id: true, createdAt: true, updatedAt: true
});
const insertLicenseActivationSchema = createInsertSchema(licenseActivations).omit({
  id: true, activatedAt: true, lastCheckedAt: true
});

// Type definitions
const User = typeof users.$inferSelect;
const InsertUser = zod.infer(typeof insertUserSchema);

const ImmutabilityRecord = typeof immutabilityRecords.$inferSelect;
const InsertImmutabilityRecord = zod.infer(typeof insertImmutabilityRecordSchema);

const SecurityLog = typeof securityLogs.$inferSelect;
const InsertSecurityLog = zod.infer(typeof insertSecurityLogSchema);

const AccessControl = typeof accessControl.$inferSelect;
const InsertAccessControl = zod.infer(typeof insertAccessControlSchema);

const FileIntegrity = typeof fileIntegrity.$inferSelect;
const InsertFileIntegrity = zod.infer(typeof insertFileIntegritySchema);

const LicenseKey = typeof licenseKeys.$inferSelect;
const InsertLicenseKey = zod.infer(typeof insertLicenseKeySchema);

const LicenseActivation = typeof licenseActivations.$inferSelect;
const InsertLicenseActivation = zod.infer(typeof insertLicenseActivationSchema);

module.exports = {
  users,
  licenseKeys,
  licenseActivations,
  permissionEnum,
  immutabilityRecords,
  securityLogs,
  accessControl,
  fileIntegrity,
  insertUserSchema,
  insertImmutabilityRecordSchema,
  insertSecurityLogSchema,
  insertAccessControlSchema,
  insertFileIntegritySchema,
  insertLicenseKeySchema,
  insertLicenseActivationSchema,
  User,
  InsertUser,
  ImmutabilityRecord,
  InsertImmutabilityRecord,
  SecurityLog,
  InsertSecurityLog,
  AccessControl,
  InsertAccessControl,
  FileIntegrity,
  InsertFileIntegrity,
  LicenseKey,
  InsertLicenseKey,
  LicenseActivation,
  InsertLicenseActivation
};