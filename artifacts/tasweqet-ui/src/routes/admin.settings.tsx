import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest } from "@/lib/admin-api";
import { adminNumber } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Settings = { platformName: string; supportPhone: string; supportEmail: string; minimumOrder: number; acceptOrders: boolean; allowRegistration: boolean; allowRestaurantApplications: boolean; maintenanceMode: boolean; otpAttempts: number; restaurantAcceptanceMinutes: number; driverOfferSeconds: number; maximumDeliveryKm: number; cancellationMinutes: number; settlementMinimum: number };
type Row = { value: Settings; version: number; updatedAt: string; updatedByAdminId: number | null };
const NUMBER_KEYS = ["minimumOrder", "otpAttempts", "restaurantAcceptanceMinutes", "driverOfferSeconds", "maximumDeliveryKm", "cancellationMinutes", "settlementMinimum"] as const;
const BOOLEAN_KEYS = ["acceptOrders", "allowRegistration", "allowRestaurantApplications", "maintenanceMode"] as const;

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const { t, locale } = useTranslation();
  const [row, setRow] = useState<Row>();
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const fieldLabel = (key: string) => ({
    platformName: t("اسم المنصة", "Platform name"), supportPhone: t("هاتف الدعم", "Support phone"), supportEmail: t("بريد الدعم", "Support email"),
    minimumOrder: t("الحد الأدنى للطلب", "Minimum order"), otpAttempts: t("محاولات OTP", "OTP attempts"), restaurantAcceptanceMinutes: t("دقائق قبول المطعم", "Restaurant acceptance minutes"),
    driverOfferSeconds: t("ثواني عرض المندوب", "Driver offer seconds"), maximumDeliveryKm: t("الحد الأقصى للتوصيل (كم)", "Maximum delivery distance (km)"), cancellationMinutes: t("دقائق الإلغاء", "Cancellation minutes"),
    settlementMinimum: t("الحد الأدنى للتسوية", "Settlement minimum"), acceptOrders: t("قبول الطلبات", "Accept orders"), allowRegistration: t("السماح بالتسجيل", "Allow registration"),
    allowRestaurantApplications: t("السماح بطلبات المطاعم", "Allow restaurant applications"), maintenanceMode: t("وضع الصيانة", "Maintenance mode"),
  }[key] ?? key);
  const load = () => adminRequest<Row>("/admin/operations/settings").then(setRow).catch((e) => setError(e instanceof Error ? e.message : t("تعذر التحميل", "Unable to load data")));
  useEffect(() => { void load(); }, []);
  async function save() {
    if (!row) return;
    try {
      const next = await adminRequest<Row>("/admin/operations/settings", { method: "PUT", body: JSON.stringify({ value: row.value, version: row.version, reason }) });
      setRow(next); setReason("");
    } catch (e) { setError(e instanceof Error ? e.message : t("فشل", "Failed")); }
  }
  const set = (key: keyof Settings, value: string | boolean) => row && setRow({ ...row, value: { ...row.value, [key]: typeof row.value[key] === "number" ? Number(value) : value } });
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("إعدادات المنصة", "Platform settings")} actions={<Button onClick={() => void save()}>{t("حفظ الإصدار", "Save version")}</Button>}>
    {error && <Card className="p-md text-error">{error}<Button onClick={() => void load()}>{t("إعادة", "Retry")}</Button></Card>}
    {!row ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> : <>
      <Card className="grid gap-2 p-md md:grid-cols-2">
        <SectionTitle title={`${t("الإصدار", "Version")} ${adminNumber(row.version, locale)}`} icon="settings" />
        {(["platformName", "supportPhone", "supportEmail"] as const).map((key) => <Field key={key} label={fieldLabel(key)} value={row.value[key]} onChange={(e) => set(key, e.target.value)} />)}
        {NUMBER_KEYS.map((key) => <Field key={key} label={fieldLabel(key)} type="number" value={String(row.value[key])} onChange={(e) => set(key, e.target.value)} />)}
      </Card>
      <Card className="grid gap-2 p-md md:grid-cols-2">
        {BOOLEAN_KEYS.map((key) => <label key={key} className="flex gap-2"><input type="checkbox" checked={row.value[key]} onChange={(e) => set(key, e.target.checked)} />{fieldLabel(key)}</label>)}
        <Field label={t("سبب التعديل (إلزامي)", "Reason for change (required)")} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Card>
    </>}
  </DashboardShell>;
}