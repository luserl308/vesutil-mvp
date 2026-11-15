import { dbPool } from "@/lib/db/pool";
import { getCurrentUser } from "./session";

export type CompanyRole = "owner" | "admin" | "editor" | "viewer";
const ROLE_LEVEL: Record<CompanyRole, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };

export async function getCompanyMembership(companyId: string) {
  const user = await getCurrentUser();
  if (!user || !dbPool) return null;
  const result = await dbPool.query(
    `SELECT m.company_id::text AS "companyId", m.role, m.status
       FROM company_memberships m
      WHERE m.company_id = $1 AND m.user_id = $2 AND m.status = 'active'
      LIMIT 1`,
    [companyId, user.id],
  );
  return result.rows[0] ?? null;
}

export async function hasCompanyRole(companyId: string, minimumRole: CompanyRole) {
  const membership = await getCompanyMembership(companyId);
  if (!membership) return false;
  return ROLE_LEVEL[membership.role as CompanyRole] >= ROLE_LEVEL[minimumRole];
}

export async function requireCompanyRole(companyId: string, minimumRole: CompanyRole) {
  const membership = await getCompanyMembership(companyId);
  if (!membership || ROLE_LEVEL[membership.role as CompanyRole] < ROLE_LEVEL[minimumRole]) {
    throw new Error("FORBIDDEN");
  }
  return membership;
}
