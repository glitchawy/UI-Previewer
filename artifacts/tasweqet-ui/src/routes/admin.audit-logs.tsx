import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, Badge, Button, Icon, Field } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { auditLogs } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "سجل التدقيق — طلبات بيتك" },
      { name: "description", content: "تتبع كل الإجراءات الحسّاسة على المنصة: من فعل ماذا ومتى ومن أي جهاز." },
      { property: "og:title", content: "سجل التدقيق — طلبات بيتك" },
      { property: "og:description", content: "تتبع كل الإجراءات الحسّاسة على المنصة: من فعل ماذا ومتى ومن أي جهاز." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminAuditLogs,
});

function AdminAuditLogs() {
  const [q, setQ] = useState("");
  const list = auditLogs.filter((l) =>
    [l.actor, l.action, l.entity, l.change].some((v) => v.includes(q)),
  );

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="سوبر أدمن — المنصة"
      nav={adminNav}
      title="سجل التدقيق"
      actions={<Button variant="outline" icon="download">تصدير السجل</Button>}
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="إجراءات اليوم" value={String(auditLogs.length * 7)} icon="fact_check" tone="info" />
          <Stat label="إجراءات حسّاسة" value={String(auditLogs.filter((l) => l.severity === "حساس").length)} icon="warning" tone="danger" />
          <Stat label="مستخدمين إداريين" value="6" icon="admin_panel_settings" tone="neutral" />
          <Stat label="مدة الاحتفاظ" value="12 شهر" icon="schedule" tone="warn" />
        </div>

        <Card className="flex flex-wrap items-end gap-sm p-md">
          <label className="flex min-w-56 flex-1 flex-col gap-1.5">
            <span className="font-label-lg text-label-lg text-on-surface-variant">بحث</span>
            <span className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 focus-within:border-secondary">
              <Icon name="search" className="text-[20px] text-outline" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالمستخدم أو الإجراء أو العنصر"
                className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
              />
            </span>
          </label>
          <Field label="من تاريخ" type="date" icon="event" />
          <Field label="إلى تاريخ" type="date" icon="event" />
        </Card>

        <div>
          <SectionTitle title="الإجراءات المسجّلة" icon="history" />
          <Table head={["الوقت", "المستخدم", "الدور", "الإجراء", "العنصر", "التغيير", "الخطورة"]} mobile="scroll">
            {list.map((l) => (
              <tr key={l.id} className="transition hover:bg-surface-container-low">
                <Td>{l.at}</Td>
                <Td>{l.actor}</Td>
                <Td><Badge tone="neutral">{l.role}</Badge></Td>
                <Td>{l.action}</Td>
                <Td><span className="text-on-surface-variant">{l.entity}</span></Td>
                <Td><span className="text-on-surface-variant">{l.change}</span></Td>
                <Td>
                  <Badge tone={l.severity === "حساس" ? "danger" : "neutral"}>{l.severity}</Badge>
                </Td>
              </tr>
            ))}
          </Table>
        </div>

        <Card className="flex items-start gap-2 p-md">
          <Icon name="lock" className="mt-0.5 text-[18px] text-secondary" />
          <p className="font-label-md text-label-md text-on-surface-variant">
            كل تغيير في العمولات أو التسعير أو الأدوار أو الاستردادات يُسجّل تلقائياً ولا يمكن حذفه. السجل للقراءة فقط.
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
