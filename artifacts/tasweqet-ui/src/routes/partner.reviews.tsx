import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Card, Badge, Button, Icon } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { partnerRequest, usePartnerResource } from "@/lib/partner-api";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/partner/reviews")({ component: PartnerReviews });
type ReviewRow = { review: { id: number; rating: number; comment: string | null; createdAt: string }; customerName: string | null; response: string | null };
type Page = { items: ReviewRow[]; total: number };

function PartnerReviews() {
  const { t } = useTranslation();
  const partnerNav = usePartnerNav();
  const query = usePartnerResource<Page>("/api/partner/operations/reviews?page=1&pageSize=50");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");
  async function save(id: number, existing: string | null) {
    const response = (drafts[id] ?? existing ?? "").trim();
    if (response.length < 2) { setError(t("اكتب رداً من حرفين على الأقل", "Write a reply of at least two characters")); return; }
    setSaving(id); setError("");
    try { await partnerRequest(`/api/partner/operations/reviews/${id}/response`, { method: "PUT", body: JSON.stringify({ response }) }); await query.reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("تعذر حفظ الرد", "Could not save reply")); }
    finally { setSaving(null); }
  }
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("التقييمات", "Reviews")}>
    {query.loading ? <Card className="p-md">{t("جارٍ التحميل...", "Loading…")}</Card> : query.error ? <Card className="p-md text-error">{query.error}<Button onClick={query.reload}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
      <div className="flex flex-col gap-md">
        {error ? <p role="alert" className="text-error">{error}</p> : null}
        {query.data?.items.map(row => <Card key={row.review.id} className="flex flex-col gap-3 p-md">
          <div className="flex items-center justify-between gap-2"><strong>{row.customerName ?? t("عميل", "Customer")}</strong><Badge tone="warn"><Icon name="star" filled /> {row.review.rating}/5</Badge></div>
          <p className="break-words text-on-surface-variant">{row.review.comment || t("لم يكتب العميل تعليقاً.", "The customer did not leave a comment.")}</p>
          <textarea value={drafts[row.review.id] ?? row.response ?? ""} onChange={event => setDrafts(old => ({ ...old, [row.review.id]: event.target.value }))} maxLength={1000} placeholder={t("رد المطعم", "Restaurant reply")} aria-label={t("رد المطعم", "Restaurant reply")} className="min-h-20 rounded-button border border-outline-variant bg-surface p-3 outline-none" />
          <Button className="w-fit" disabled={saving === row.review.id} onClick={() => save(row.review.id, row.response)}>{saving === row.review.id ? t("جارٍ الحفظ...", "Saving…") : row.response ? t("تحديث الرد", "Update reply") : t("نشر الرد", "Post reply")}</Button>
        </Card>)}
        {!query.data?.items.length ? <Card className="p-lg text-center text-on-surface-variant">{t("لا توجد تقييمات ظاهرة لمطعمك حتى الآن.", "No reviews are visible for your restaurant yet.")}</Card> : null}
      </div>}
  </DashboardShell>;
}