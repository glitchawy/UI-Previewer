import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { businessAuditLogsTable, db } from "@workspace/db";

type AuditValue = Record<string, unknown> | unknown[] | null;

export interface BusinessAuditInput {
  actorAdminId: number;
  action: string;
  entityType: string;
  entityId: string | number;
  before?: AuditValue;
  after?: AuditValue;
  reason?: string | null;
  requestId: string;
}

type AuditExecutor = Pick<typeof db, "insert">;

export function requestIdForAudit(req: Request): string {
  if (req.id != null) return String(req.id);
  const header = req.headers["x-request-id"];
  if (typeof header === "string" && header.trim()) return header.trim().slice(0, 200);
  return randomUUID();
}

export async function recordBusinessAudit(
  executor: AuditExecutor,
  input: BusinessAuditInput,
): Promise<void> {
  await executor.insert(businessAuditLogsTable).values({
    actorAdminId: input.actorAdminId,
    action: input.action,
    entityType: input.entityType,
    entityId: String(input.entityId),
    before: input.before,
    after: input.after,
    reason: input.reason?.trim() || null,
    requestId: input.requestId,
  });
}