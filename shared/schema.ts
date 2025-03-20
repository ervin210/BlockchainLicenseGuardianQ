import { pgTable, serial, text, timestamp, boolean, json, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
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

// Permissions enum for access control
export const permissionEnum = pgEnum("permission", ["read", "write", "admin"]);

// Code immutability records table - tracks code stored on blockchain
export const immutabilityRecords = pgTable("immutability_records", {
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
export const securityLogs = pgTable("security_logs", {
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
export const accessControl = pgTable("access_control", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  resourceId: text("resource_id").notNull(),
  permission: permissionEnum("permission").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// File integrity table for tracking unauthorized modifications
export const fileIntegrity = pgTable("file_integrity", {
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
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertImmutabilityRecordSchema = createInsertSchema(immutabilityRecords).omit({ 
  id: true, createdAt: true, lastVerified: true, blockchainTxId: true, status: true 
});
export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({ 
  id: true, createdAt: true 
});
export const insertAccessControlSchema = createInsertSchema(accessControl).omit({ 
  id: true, createdAt: true 
});
export const insertFileIntegritySchema = createInsertSchema(fileIntegrity).omit({ 
  id: true, createdAt: true, updatedAt: true, blockchainTxId: true, status: true 
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ImmutabilityRecord = typeof immutabilityRecords.$inferSelect;
export type InsertImmutabilityRecord = z.infer<typeof insertImmutabilityRecordSchema>;

export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;

export type AccessControl = typeof accessControl.$inferSelect;
export type InsertAccessControl = z.infer<typeof insertAccessControlSchema>;

export type FileIntegrity = typeof fileIntegrity.$inferSelect;
export type InsertFileIntegrity = z.infer<typeof insertFileIntegritySchema>;