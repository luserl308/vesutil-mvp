-- Local email/password auth, single-use email tokens, and persistent rate-limit buckets.
BEGIN;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS auth_email_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('verify_email','password_reset')),
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_email_tokens_user_purpose_idx
  ON auth_email_tokens(user_id, purpose, expires_at DESC);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket_key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at timestamptz NOT NULL,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_rate_limits_updated_idx ON auth_rate_limits(updated_at);

COMMENT ON COLUMN app_users.password_hash IS 'Argon2id password hash; never return this field from an API.';
COMMENT ON COLUMN app_users.email_verified_at IS 'Set only after a valid single-use email verification token is consumed.';
COMMENT ON TABLE auth_email_tokens IS 'Single-use email tokens; only SHA-256 token hashes are stored.';
COMMENT ON TABLE auth_rate_limits IS 'Persistent coarse-grained rate limits for public authentication endpoints.';

COMMIT;