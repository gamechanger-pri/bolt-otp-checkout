-- Postgres schema. Run once: psql "$DATABASE_URL" -f db/001_schema.sql
CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  email           TEXT NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  code_hash       TEXT NOT NULL,              -- bcrypt hash of the 6-digit code
  failed_attempts INT  NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- emails are stored lowercase; unique index enforces one account per email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,                -- sha256 of the bearer token
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS checkout_submissions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT REFERENCES users(id),   -- NULL when the user skipped login
  email        TEXT NOT NULL,
  phone        TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city         TEXT NOT NULL,
  postal_code  TEXT NOT NULL,
  country      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
