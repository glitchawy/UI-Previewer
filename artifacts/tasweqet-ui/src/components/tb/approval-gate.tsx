// Shared client-side gate: blocks operational partner/driver routes until the
// user's application is APPROVED (or ACTIVE for partners). Fails closed while
// the status is loading or on error.
import { type ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, Icon } from "@/components/tb/shell";
import { fetchMyApplicationStatus } from "@/lib/tb/applications";

export type GateState =
  | { kind: "loading" }
  | { kind: "blocked"; status: string | null }
  | { kind: "approved"; status: string };

export function useApplicationGate(approvedStatuses: readonly string[]): GateState {
  const [status, setStatus] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    fetchMyApplicationStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        if (!cancelled) setStatus(null); // fail closed
      });
    return () => {
      cancelled = true;
    };
  }, []);
  if (status === undefined) return { kind: "loading" };
  if (status !== null && approvedStatuses.includes(status)) return { kind: "approved", status };
  return { kind: "blocked", status };
}

export function GateLoadingCard() {
  return <Card className="p-lg font-body-md text-body-md text-on-surface-variant">جاري التحقق من حالة حسابك...</Card>;
}

export function GateBlockedCard({
  status,
  role,
  extra,
}: {
  status: string | null;
  role: "partner" | "driver";
  extra?: ReactNode;
}) {
  const rejected = status === "REJECTED";
  const suspended = status === "SUSPENDED";
  return (
    <>
      <Card className="flex flex-col items-center gap-sm p-lg text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-error-container">
          <Icon
            name={rejected ? "cancel" : suspended ? "block" : "hourglass_top"}
            className="text-[32px] text-on-error-container"
          />
        </span>
        <p className="font-headline-md text-headline-md text-on-surface">
          {rejected
            ? role === "partner"
              ? "تم رفض طلب تسجيل مطعمك"
              : "تم رفض طلب توثيقك"
            : suspended
            ? "حسابك موقوف حالياً"
            : "حسابك لسه قيد المراجعة"}
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {rejected || suspended
            ? "تواصل مع الدعم على support@tasweqet.eg لمعرفة التفاصيل."
            : role === "partner"
            ? "هتتفعّل لوحة التحكم بالكامل بعد موافقة الإدارة على تسجيل مطعمك."
            : "مش هتقدر تستقبل طلبات غير بعد موافقة الإدارة على توثيقك."}
        </p>
      </Card>
      {role === "driver" && !suspended ? (
        <Link to="/driver/documents" className="flex items-center justify-between gap-2 rounded-card bg-error-container p-md">
          <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-error-container">
            <Icon name="warning" className="text-[18px]" />
            راجع واتمم مستنداتك
          </span>
          <Icon name="chevron_left" className="text-on-error-container" />
        </Link>
      ) : null}
      {extra}
    </>
  );
}
