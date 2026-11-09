import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

 
export type Meta = Record<string, any>;

export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(), // paper | ai_news | applied | industry | geo | video | hn
    domain: text("domain").notNull().default("general"),
    source: text("source").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    summary: text("summary").notNull().default(""),
    authors: jsonb("authors").$type<string[]>().notNull().default([]),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    score: integer("score").notNull().default(0),
    quality: real("quality").notNull().default(0),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    meta: jsonb("meta").$type<Meta>().notNull().default({}),
    ai: jsonb("ai").$type<{
      text: string;
      at: string;
      model?: string;
    } | null>(),
    saved: boolean("saved").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("items_url_uq").on(t.url),
    index("items_kind_idx").on(t.kind, t.domain),
  ],
);

export const sources = pgTable(
  "sources",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(), // rss | reddit | youtube | mastodon | hn | github_topic | gnews
    name: text("name").notNull(),
    target: text("target").notNull(),
    section: text("section").notNull().default("ai_news"),
    domain: text("domain").notNull().default("general"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("sources_type_target_uq").on(t.type, t.target)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Meta>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Goal = { text: string; done: boolean };

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  repo: text("repo").notNull().default(""),
  tagline: text("tagline").notNull().default(""),
  emoji: text("emoji").notNull().default("🚀"),
  accent: text("accent").notNull().default("violet"),
  status: text("status").notNull().default("active"),
  nextAction: text("next_action").notNull().default(""),
  goals: jsonb("goals").$type<Goal[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  provider: text("provider").notNull().default("custom"),
  host: text("host").notNull(),
  port: integer("port").notNull().default(993),
  secure: boolean("secure").notNull().default(true),
  username: text("username").notNull(),
  passEnc: text("pass_enc").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Item = typeof items.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Source = typeof sources.$inferSelect;
