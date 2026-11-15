-- Revocable opaque server-side sessions. Only token hashes are stored.
BEGIN;

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE INDEX IF NOT EXISTS user_sessions_user_active_idx
  ON user_sessions(user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS user_sessions_expiry_idx
  ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS
  'Opaque revocable sessions. Raw bearer tokens exist only in the HttpOnly browser cookie; PostgreSQL stores SHA-256 hashes.';

COMMIT;
