import { pool } from "@/db";

// Creates all tables on first run so the app is self-bootstrapping on any laptop
// (no manual migration step needed). Memoised per process.
const g = globalThis as typeof globalThis & {
  __atlasSchemaReady?: Promise<void>;
};

const SQL = `
CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  kind text NOT NULL,
  domain text NOT NULL DEFAULT 'general',
  source text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  summary text NOT NULL DEFAULT '',
  authors jsonb NOT NULL DEFAULT '[]',
  published_at timestamptz NOT NULL DEFAULT now(),
  score integer NOT NULL DEFAULT 0,
  quality real NOT NULL DEFAULT 0,
  tags jsonb NOT NULL DEFAULT '[]',
  meta jsonb NOT NULL DEFAULT '{}',
  ai jsonb,
  saved boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS items_url_uq ON items(url);
CREATE INDEX IF NOT EXISTS items_kind_idx ON items(kind, domain);
CREATE INDEX IF NOT EXISTS items_published_idx ON items(published_at DESC);
CREATE INDEX IF NOT EXISTS items_tags_idx ON items USING gin(tags);
CREATE TABLE IF NOT EXISTS sources (
  id serial PRIMARY KEY,
  type text NOT NULL,
  name text NOT NULL,
  target text NOT NULL,
  section text NOT NULL DEFAULT 'ai_news',
  domain text NOT NULL DEFAULT 'general',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sources_type_target_uq ON sources(type, target);
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS projects (
  id serial PRIMARY KEY,
  title text NOT NULL,
  repo text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '🚀',
  accent text NOT NULL DEFAULT 'violet',
  status text NOT NULL DEFAULT 'active',
  next_action text NOT NULL DEFAULT '',
  goals jsonb NOT NULL DEFAULT '[]',
  notes text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS email_accounts (
  id serial PRIMARY KEY,
  label text NOT NULL,
  provider text NOT NULL DEFAULT 'custom',
  host text NOT NULL,
  port integer NOT NULL DEFAULT 993,
  secure boolean NOT NULL DEFAULT true,
  username text NOT NULL,
  pass_enc text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

export function ready(): Promise<void> {
  if (!g.__atlasSchemaReady) {
    g.__atlasSchemaReady = pool
      .query(SQL)
      .then(() => undefined)
      .catch((e) => {
        g.__atlasSchemaReady = undefined;
        throw e;
      });
  }
  return g.__atlasSchemaReady;
}
