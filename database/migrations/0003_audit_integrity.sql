-- Enforce append-only behavior for audit events at the database layer.
BEGIN;

CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_events_no_update ON audit_events;
CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();

CREATE INDEX IF NOT EXISTS company_memberships_company_user_active_idx
  ON company_memberships(company_id, user_id) WHERE status = 'active';

COMMIT;
