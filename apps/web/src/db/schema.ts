import { pgTable, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Users Table
 * Stores authenticated or connected developer identities.
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(),
  githubId: varchar("github_id", { length: 128 }).unique(),
  githubUsername: varchar("github_username", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Projects Table
 * Stores forged repositories, their target frameworks, CI/CD configuration, and deployment states.
 */
export const projects = pgTable("projects", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }),
  name: varchar("name", { length: 255 }).notNull(),
  repoOwner: varchar("repo_owner", { length: 255 }).notNull(),
  repoName: varchar("repo_name", { length: 255 }).notNull(),
  repoUrl: text("repo_url").notNull(),
  description: text("description"),
  framework: varchar("framework", { length: 100 }).notNull(),
  template: varchar("template", { length: 100 }).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  branch: varchar("branch", { length: 100 }).default("main").notNull(),
  status: varchar("status", { length: 50 }).default("ready").notNull(),
  addCICD: boolean("add_cicd").default(true).notNull(),
  deployVercel: boolean("deploy_vercel").default(true).notNull(),
  vercelUrl: text("vercel_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Deployments Table
 * Stores deployment logs, live URL endpoints, and environment status.
 */
export const deployments = pgTable("deployments", {
  id: varchar("id", { length: 128 }).primaryKey(),
  projectId: varchar("project_id", { length: 128 })
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(), // 'vercel' | 'cloudflare' | 'docker'
  url: text("url").notNull(),
  status: varchar("status", { length: 50 }).default("ready").notNull(), // 'ready' | 'building' | 'failed'
  environment: varchar("environment", { length: 50 }).default("production").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Credentials Table
 * Encrypted or user-scoped token records for GitHub OAuth/PAT and Vercel.
 */
export const credentials = pgTable("credentials", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }),
  provider: varchar("provider", { length: 50 }).notNull(), // 'github' | 'vercel'
  accessToken: text("access_token").notNull(),
  username: varchar("username", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Table Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  credentials: many(credentials),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  deployments: many(deployments),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  project: one(projects, {
    fields: [deployments.projectId],
    references: [projects.id],
  }),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  user: one(users, {
    fields: [credentials.userId],
    references: [users.id],
  }),
}));

// Export inferred types for clean TypeScript usage across the app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;

export type Credential = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;
