import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Icon, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";
import { useTranslation } from "@/lib/i18n";

type Review = { review: { id: number; rating: number; comment: string | null; moderationStatus: "visible" | "hidden"; moderationReason: string | null; createdAt: string }; customerName: string | null; restaurantName: string | null };
export const Route = createFileRoute("/admin/reviews")({ component: Reviews });

function Reviews() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [data, setData] = useState<Page<Review>>();
  const [error, setError] = useState("");
  const statusLabel = (value: string) => ({ "": t("الكل", "All"), visible: t("ظاهر", "Visible"), hidden: t("مخفي", "Hidden") }[value] ?? value);
  const load = useCallback(() => adminRequest<Page<Review>>(`/admin/operations/reviews?page=1&pageSize=50&status=${status}`)
    .then(setData)
    .catch((e) => setError(e instanceof Error ? e.message : t("تعذر التحميل", "Unable to load data"))), [status, t]);
  useEffect(() => { void load(); }, [load]);
  async function moderate(review: Review) {
    const next = review.review.moderationStatus === "visible" ? "hidden" : "visible";
    const reason = prompt(next === "hidden" ? t("سبب الإخفاء", "Reason for hiding") : t("سبب الإظهار", "Reason for showing"));
    if (!reason) return;
    try {
      await adminRequest(`/admin/operations/reviews/${review.review.id}`, { method: "PATCH", body: JSON.stringify({ status: next, reason }) });
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : t("فشل الحفظ", "Save failed"));
    }
  }
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("التقييمات", "Reviews")}>
    <div className="flex gap-2">{["", "visible", "hidden"].map((s) => <Button key={s || "all"} variant={status === s ? "primary" : "outline"} onClick={() => setStatus(s)}>{statusLabel(s)}</Button>)}</div>
    <SectionTitle title={t("تقييمات طلبات مسلّمة موثقة", "Verified reviews for delivered orders")} icon="reviews" />
    {error ? <Card className="p-md text-error">{error}<Button onClick={() => void load()}>{t("إعادة", "Retry")}</Button></Card> :
      !data ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> :
        !data.items.length ? <Card className="p-md">{t("لا توجد تقييمات.", "No reviews.")}</Card> :
          <Table head={[t("العميل", "Customer"), t("المطعم", "Restaurant"), t("التقييم", "Rating"), t("التعليق", "Comment"), t("الحالة", "Status"), t("الإجراء", "Action")]} mobile="scroll">
            {data.items.map((x) => <tr key={x.review.id}><Td>{x.customerName || "—"}</Td><Td>{x.restaurantName || "—"}</Td><Td><span className="flex" aria-label={`${x.review.rating} ${t("من 5", "of 5")}`}>{Array.from({ length: 5 }, (_, i) => <Icon key={i} name="star" filled={i < x.review.rating} />)}</span></Td><Td>{x.review.comment || "—"}</Td><Td>{statusLabel(x.review.moderationStatus)}</Td><Td><Button variant={x.review.moderationStatus === "visible" ? "danger" : "outline"} onClick={() => void moderate(x)}>{x.review.moderationStatus === "visible" ? t("إخفاء", "Hide") : t("إظهار", "Show")}</Button></Td></tr>)}
          </Table>}
  </DashboardShell>;
}