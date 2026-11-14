-- Vesutil: company users, memberships, invitations and audit trail.
-- PostgreSQL 15+. Schema-only migration; review and test on a disposable DB before production.
BEGIN;

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider text NOT NULL,
  auth_subject text NOT NULL,
  email text,
  display_name text,
  phone text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (auth_provider, auth_subject)
);
CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_lower_idx
  ON app_users (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS company_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','editor','viewer')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','left')),
  invited_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
CREATE INDEX IF NOT EXISTS company_memberships_user_status_idx
  ON company_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS company_memberships_company_status_idx
  ON company_memberships(company_id, status);

CREATE TABLE IF NOT EXISTS company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','editor','viewer')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at timestamptz NOT NULL,
  accepted_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'accepted' OR (accepted_by IS NOT NULL AND accepted_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS company_invitations_company_status_idx
  ON company_invitations(company_id, status);
CREATE INDEX IF NOT EXISTS company_invitations_email_lower_idx
  ON company_invitations(lower(email), status);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  change_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_company_created_idx
  ON audit_events(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_entity_idx
  ON audit_events(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_actor_created_idx
  ON audit_events(actor_user_id, created_at DESC);

COMMENT ON TABLE app_users IS
  'Application profile mapped to an identity in an external authentication provider. Never stores passwords.';
COMMENT ON TABLE company_memberships IS
  'Company-level membership. Authorization must be checked server-side for every company resource.';
COMMENT ON TABLE company_invitations IS
  'Invitation tokens are stored as hashes only; raw tokens must be delivered once and never logged.';
COMMENT ON TABLE audit_events IS
  'Append-only audit trail for company, branch, offer and price changes. Restrict UPDATE/DELETE to maintenance role.';

COMMIT;
