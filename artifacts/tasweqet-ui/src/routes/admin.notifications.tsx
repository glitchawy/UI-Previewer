import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, Badge, Button, Icon, Field } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { notifTemplates, notifDevices } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات — طلبات بيتك" },
      { name: "description", content: "إدارة إشعارات الطلبات، قوالب الرسائل، أجهزة المستخدمين وسجل الإرسال." },
      { property: "og:title", content: "الإشعارات — طلبات بيتك" },
      { property: "og:description", content: "إدارة إشعارات الطلبات، قوالب الرسائل، أجهزة المستخدمين وسجل الإرسال." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminNotifications,
});

function AdminNotifications() {
  const [active, setActive] = useState<string[]>(notifTemplates.filter((t) => t.active).map((t) => t.id));
  const [composer, setComposer] = useState(false);

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="سوبر أدمن — المنصة"
      nav={adminNav}
      title="الإشعارات"
      actions={<Button icon="send" onClick={() => setComposer((v) => !v)}>إشعار جديد</Button>}
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="إشعارات مُرسلة (24س)" value="4,120" icon="notifications_active" tone="info" delta="6%" />
          <Stat label="نسبة الفتح" value="42%" icon="open_in_new" tone="success" />
          <Stat label="فشل الإرسال" value="0.6%" icon="error" tone="danger" />
          <Stat label="أجهزة مُسجّلة" value="9,842" icon="devices" tone="neutral" />
        </div>

        {composer ? (
          <Card className="flex flex-col gap-sm p-md">
            <SectionTitle title="إرسال إشعار" icon="campaign" />
            <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
              <Field label="العنوان" placeholder="عنوان الإشعار" icon="title" />
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="font-label-lg text-label-lg text-on-surface-variant">النص</span>
                <textarea
                  rows={2}
                  placeholder="اكتب نص الإشعار…"
                  className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:border-secondary"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["كل العملاء", "عملاء منطقة", "المندوبين", "المطاعم"].map((s, i) => (
                <span
                  key={s}
                  className={`rounded-full px-3 py-1.5 font-label-md text-label-md ${
                    i === 0 ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button icon="send">إرسال الآن</Button>
              <Button variant="outline" icon="schedule">جدولة</Button>
              <Button variant="ghost" onClick={() => setComposer(false)}>إلغاء</Button>
            </div>
          </Card>
        ) : null}

        <div>
          <SectionTitle title="قوالب الإشعارات التلقائية" icon="auto_awesome" />
          <Table head={["الحدث", "العنوان", "النص", "القناة", "أُرسلت", "فشل", "الحالة"]}>
            {notifTemplates.map((t) => {
              const on = active.includes(t.id);
              return (
                <tr key={t.id} className="transition hover:bg-surface-container-low">
                  <Td>{t.event}</Td>
                  <Td>{t.title}</Td>
                  <Td><span className="text-on-surface-variant">{t.body}</span></Td>
                  <Td><Badge tone="info">{t.channels}</Badge></Td>
                  <Td>{t.sent.toLocaleString("ar-EG")}</Td>
                  <Td><span className={t.failed > 50 ? "text-error" : "text-on-surface"}>{t.failed}</span></Td>
                  <Td>
                    <button
                      onClick={() => setActive((a) => (on ? a.filter((x) => x !== t.id) : [...a, t.id]))}
                      className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary-container" : "bg-surface-container-high"}`}
                      aria-label="تشغيل/إيقاف"
                    >
                      <span className={`absolute top-0.5 size-5 rounded-full bg-surface-container-lowest transition ${on ? "right-0.5" : "right-5"}`} />
                    </button>
                  </Td>
                </tr>
              );
            })}
          </Table>
        </div>

        <div className="grid grid-cols-1 gap-md xl:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionTitle title="أجهزة المستخدمين (Device tokens)" icon="devices" />
            <Table head={["المستخدم", "النظام", "التوكن", "آخر ظهور", "الحالة"]}>
              {notifDevices.map((d) => (
                <tr key={d.id} className="transition hover:bg-surface-container-low">
                  <Td>{d.user}</Td>
                  <Td><Badge tone="neutral">{d.platform}</Badge></Td>
                  <Td><span dir="ltr" className="text-on-surface-variant">{d.token}</span></Td>
                  <Td>{d.lastSeen}</Td>
                  <Td><Badge tone={d.active ? "success" : "danger"}>{d.active ? "نشط" : "منتهي"}</Badge></Td>
                </tr>
              ))}
            </Table>
          </div>

          <Card className="flex flex-col gap-sm p-md">
            <SectionTitle title="إعدادات ومتابعة" icon="tune" />
            {[
              { label: "تحديث التوكن تلقائياً", on: true },
              { label: "دعم أجهزة متعددة للمستخدم", on: true },
              { label: "إعادة المحاولة عند فشل الإرسال", on: true },
              { label: "احترام تفضيلات الإشعارات", on: true },
              { label: "إشعارات تسويقية", on: false },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-button bg-surface-container-low px-3 py-2.5">
                <span className="font-label-md text-label-md text-on-surface">{s.label}</span>
                <Badge tone={s.on ? "success" : "neutral"}>{s.on ? "مُفعّل" : "موقوف"}</Badge>
              </div>
            ))}
            <p className="flex items-start gap-1 font-label-md text-label-md text-outline">
              <Icon name="info" className="text-[16px]" />
              كل الإشعارات تُرسل من السيرفر ويُسجَّل نجاحها أو فشلها.
            </p>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
