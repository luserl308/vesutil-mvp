import { dbPool } from "@/lib/db/pool";

type AuditEvent = {
  actorUserId?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  changeSummary?: Record<string, unknown>;
  requestId?: string | null;
};

export async function writeAuditEvent(event: AuditEvent) {
  if (!dbPool) throw new Error("DATABASE_NOT_CONFIGURED");
  await dbPool.query(
    `INSERT INTO audit_events
      (actor_user_id, company_id, branch_id, entity_type, entity_id, action, change_summary, request_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [event.actorUserId ?? null, event.companyId ?? null, event.branchId ?? null,
      event.entityType, event.entityId ?? null, event.action,
      JSON.stringify(event.changeSummary ?? {}), event.requestId ?? null],
  );
}
