import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, Icon, SectionTitle, StatusBadge } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, refunds } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/refunds")({
  head: () => ({
    meta: [
      { title: "الاستردادات | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "مراجعة والموافقة على طلبات استرداد أموال العملاء." },
      { property: "og:title", content: "الاستردادات | طلبات بيتك" },
      { property: "og:description", content: "مراجعة طلبات الاسترداد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminRefunds,
});

const auditLog = [
  { text: "تمت الموافقة على RF-200 من قبل مالية-3 وإضافة 60 ج.م للمحفظة", at: "الإثنين 13:22" },
  { text: "تم رفض RF-199 من قبل مالية-1 (سبب غير كافٍ)", at: "الأحد 22:18" },
];

function AdminRefunds() {
  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="الاستردادات">
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="p-md">
          <SectionTitle title="آلية العمل" icon="alt_route" />
          <div className="flex flex-wrap items-center gap-2 font-label-md text-label-md text-on-surface-variant">
            <span className="rounded-full bg-surface-container px-3 py-1.5">طلب استرداد</span>
            <Icon name="arrow_back" className="text-[16px]" />
            <span className="rounded-full bg-surface-container px-3 py-1.5">مراجعة أدمن مصرح</span>
            <Icon name="arrow_back" className="text-[16px]" />
            <span className="rounded-full bg-surface-container px-3 py-1.5">موافقة / رفض</span>
            <Icon name="arrow_back" className="text-[16px]" />
            <span className="rounded-full bg-primary-container px-3 py-1.5 text-on-primary-container">تنفيذ على المحفظة/البطاقة</span>
          </div>
        </Card>

        <Card className="flex items-center gap-2 bg-error-container p-md text-on-error-container">
          <Icon name="block" />
          <span className="font-label-lg text-label-lg">المطعم لا يملك صلاحية الاسترداد — القرار حصري لأدمن المنصة.</span>
        </Card>

        <div className="flex flex-col gap-sm">
          {refunds.map((r) => (
            <Card key={r.id} className="flex flex-col gap-sm p-md md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-label-lg text-label-lg text-on-surface">{r.id}</span>
                  <StatusBadge status={r.status} label={r.status === "PENDING" ? "بانتظار المراجعة" : r.status === "APPROVED" ? "تمت الموافقة" : "مرفوض"} />
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  الطلب {r.order} · {r.customer} · {EGP(r.amount)} · {r.method === "WALLET" ? "استرداد للمحفظة" : "استرداد للبطاقة"}
                </p>
                <p className="font-label-md text-label-md text-on-surface-variant">السبب: {r.reason} · {r.at}</p>
              </div>
              {r.status === "PENDING" ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[200px]"><Field label="سبب القرار" placeholder="اكتب ملاحظة" /></div>
                  <Button variant="primary" icon="check_circle">موافقة</Button>
                  <Button variant="danger" icon="cancel">رفض</Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>

        <Card className="p-md">
          <SectionTitle title="سجل التدقيق" icon="history" />
          <ul className="flex flex-col gap-2">
            {auditLog.map((a, i) => (
              <li key={i} className="flex items-center justify-between font-label-md text-label-md text-on-surface-variant">
                <span>{a.text}</span>
                <span>{a.at}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}
