import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Table, Td, Badge, Button, Icon, Field } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRoles, allPermissions } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({
    meta: [
      { title: "الأدوار والصلاحيات — طلبات بيتك" },
      { name: "description", content: "إدارة أدوار الأدمن والصلاحيات والتحقق بخطوتين لفريق المنصة." },
      { property: "og:title", content: "الأدوار والصلاحيات — طلبات بيتك" },
      { property: "og:description", content: "إدارة أدوار الأدمن والصلاحيات والتحقق بخطوتين لفريق المنصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminRoles,
});

const admins = [
  { id: "a1", name: "هاني عبد الله", email: "hany@talabatbetak.com", role: "سوبر أدمن", twofa: true, active: true },
  { id: "a2", name: "أحمد فؤاد", email: "ahmed@talabatbetak.com", role: "مدير تشغيل", twofa: true, active: true },
  { id: "a3", name: "منى رشدي", email: "mona@talabatbetak.com", role: "مالية", twofa: true, active: true },
  { id: "a4", name: "سيف الدين محمد", email: "seif@talabatbetak.com", role: "دعم العملاء", twofa: false, active: true },
  { id: "a5", name: "ريم حسن", email: "reem@talabatbetak.com", role: "دعم العملاء", twofa: false, active: false },
];

function AdminRoles() {
  const [selected, setSelected] = useState(adminRoles[1]!.id);
  const [granted, setGranted] = useState<string[]>(["لوحة التحكم", "الطلبات", "التجار", "المندوبين"]);
  const [creating, setCreating] = useState(false);
  const role = adminRoles.find((r) => r.id === selected) ?? adminRoles[0]!;

  const toggle = (p: string) =>
    setGranted((g) => (g.includes(p) ? g.filter((x) => x !== p) : [...g, p]));

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="سوبر أدمن — المنصة"
      nav={adminNav}
      title="الأدوار والصلاحيات"
      actions={<Button icon="person_add" onClick={() => setCreating((v) => !v)}>إضافة أدمن</Button>}
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <Badge tone="info" className="w-fit">
          <Icon name="admin_panel_settings" className="text-[16px]" />
          الصلاحيات مخزّنة في قاعدة البيانات ويتم التحقق منها على السيرفر
        </Badge>

        {creating ? (
          <Card className="flex flex-col gap-sm p-md">
            <SectionTitle title="أدمن جديد" icon="person_add" />
            <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
              <Field label="الاسم" placeholder="اسم الأدمن" icon="person" />
              <Field label="البريد الإلكتروني" placeholder="name@talabatbetak.com" icon="mail" />
              <label className="flex flex-col gap-1.5">
                <span className="font-label-lg text-label-lg text-on-surface-variant">الدور</span>
                <select className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none">
                  {adminRoles.map((r) => (
                    <option key={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button icon="check">إنشاء الحساب</Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>إلغاء</Button>
              <Badge tone="warn"><Icon name="verified_user" className="text-[14px]" />التحقق بخطوتين إلزامي</Badge>
            </div>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-md lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-sm">
            <SectionTitle title="الأدوار" icon="groups" action={<Button variant="outline" icon="add" className="!px-3 !py-1.5">دور جديد</Button>} />
            {adminRoles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`flex items-center justify-between rounded-card border p-md text-right transition ${
                  selected === r.id
                    ? "border-2 border-secondary bg-secondary-container"
                    : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                }`}
              >
                <span className="flex flex-col gap-1">
                  <span className="font-label-lg text-label-lg text-on-surface">{r.name}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">{r.permissions.join(" · ")}</span>
                </span>
                <Badge tone="neutral">{r.members} عضو</Badge>
              </button>
            ))}
          </div>

          <Card className="flex flex-col gap-sm p-md">
            <SectionTitle
              title={`صلاحيات: ${role.name}`}
              icon="rule"
              action={<Button icon="save" className="!px-3 !py-1.5">حفظ</Button>}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {allPermissions.map((p) => {
                const on = role.id === "super" || granted.includes(p);
                return (
                  <button
                    key={p}
                    disabled={role.id === "super"}
                    onClick={() => toggle(p)}
                    className={`flex items-center justify-between rounded-button border px-3 py-2.5 text-right font-label-md text-label-md transition ${
                      on
                        ? "border-secondary bg-secondary-container text-on-secondary-container"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary"
                    } ${role.id === "super" ? "opacity-70" : ""}`}
                  >
                    {p}
                    <Icon name={on ? "check_circle" : "radio_button_unchecked"} className="text-[18px]" />
                  </button>
                );
              })}
            </div>
            {role.id === "super" ? (
              <p className="font-label-md text-label-md text-outline">السوبر أدمن يملك كل الصلاحيات ولا يمكن تعديلها.</p>
            ) : null}
          </Card>
        </div>

        <div>
          <SectionTitle title="فريق الإدارة" icon="badge" />
          <Table head={["الاسم", "البريد", "الدور", "التحقق بخطوتين", "الحالة", ""]}>
            {admins.map((a) => (
              <tr key={a.id} className="transition hover:bg-surface-container-low">
                <Td>{a.name}</Td>
                <Td><span dir="ltr">{a.email}</span></Td>
                <Td><Badge tone="neutral">{a.role}</Badge></Td>
                <Td><Badge tone={a.twofa ? "success" : "danger"}>{a.twofa ? "مُفعّل" : "غير مُفعّل"}</Badge></Td>
                <Td><Badge tone={a.active ? "success" : "danger"}>{a.active ? "نشط" : "موقوف"}</Badge></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" icon="edit" className="!px-3 !py-1.5">تعديل</Button>
                    <Button variant="ghost" icon="block" className="!px-3 !py-1.5">إيقاف</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </DashboardShell>
  );
}
