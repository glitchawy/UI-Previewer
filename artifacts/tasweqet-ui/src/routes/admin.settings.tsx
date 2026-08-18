import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Table, Td, Badge, Button, Icon, Field } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { retentionPolicies, securityChecks } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "إعدادات المنصة — طلبات بيتك" },
      { name: "description", content: "إعدادات الأمان، التحقق بخطوتين، مدة الاحتفاظ بالبيانات وخصوصية المستخدمين." },
      { property: "og:title", content: "إعدادات المنصة — طلبات بيتك" },
      { property: "og:description", content: "إعدادات الأمان، التحقق بخطوتين، مدة الاحتفاظ بالبيانات وخصوصية المستخدمين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSettings,
});

const tabs = ["عام", "الأمان", "البيانات والخصوصية", "التشغيل"] as const;

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="تشغيل/إيقاف"
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-primary-container" : "bg-surface-container-high"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-surface-container-lowest transition ${on ? "right-0.5" : "right-5"}`} />
    </button>
  );
}

function AdminSettings() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("عام");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    orders: true,
    registration: true,
    newRestaurants: true,
    driverAuto: false,
    twoFA: true,
    sessionLock: true,
    maintenance: false,
  });
  const toggle = (k: string) => setFlags((f) => ({ ...f, [k]: !f[k] }));

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="سوبر أدمن — المنصة"
      nav={adminNav}
      title="إعدادات المنصة"
      actions={<Button icon="save">حفظ التغييرات</Button>}
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 font-label-md text-label-md transition ${
                tab === t
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "عام" ? (
          <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
            <Card className="flex flex-col gap-sm p-md">
              <SectionTitle title="بيانات المنصة" icon="storefront" />
              <Field label="اسم المنصة" placeholder="طلبات بيتك" icon="badge" />
              <Field label="رقم الدعم" placeholder="19999" icon="support_agent" />
              <Field label="بريد الدعم" placeholder="support@talabatbetak.com" icon="mail" />
              <Field label="أقل قيمة طلب (ج.م)" placeholder="50" icon="shopping_bag" />
            </Card>
            <Card className="flex flex-col gap-sm p-md">
              <SectionTitle title="مفاتيح التشغيل" icon="toggle_on" />
              {[
                { k: "orders", l: "استقبال الطلبات" },
                { k: "registration", l: "تسجيل مستخدمين جدد" },
                { k: "newRestaurants", l: "قبول طلبات انضمام المطاعم" },
                { k: "maintenance", l: "وضع الصيانة" },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between rounded-button bg-surface-container-low px-3 py-2.5">
                  <span className="font-label-md text-label-md text-on-surface">{r.l}</span>
                  <Toggle on={!!flags[r.k]} onClick={() => toggle(r.k)} />
                </div>
              ))}
            </Card>
          </div>
        ) : null}

        {tab === "الأمان" ? (
          <div className="flex flex-col gap-md">
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
              {securityChecks.map((c) => (
                <Card key={c.id} className="flex flex-col gap-2 p-md">
                  <span className="flex size-9 items-center justify-center rounded-full bg-secondary-container">
                    <Icon name={c.icon} className="text-[20px] text-on-secondary-container" />
                  </span>
                  <p className="font-label-lg text-label-lg text-on-surface">{c.label}</p>
                  <Badge tone={c.tone === "success" ? "success" : "warn"}>{c.state}</Badge>
                </Card>
              ))}
            </div>
            <Card className="flex flex-col gap-sm p-md">
              <SectionTitle title="التحقق بخطوتين والجلسات" icon="verified_user" />
              {[
                { k: "twoFA", l: "إلزام التحقق بخطوتين لكل الأدمن" },
                { k: "sessionLock", l: "إنهاء الجلسة بعد 30 دقيقة خمول" },
                { k: "driverAuto", l: "قبول تلقائي لمستندات المندوبين" },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between rounded-button bg-surface-container-low px-3 py-2.5">
                  <span className="font-label-md text-label-md text-on-surface">{r.l}</span>
                  <Toggle on={!!flags[r.k]} onClick={() => toggle(r.k)} />
                </div>
              ))}
              <Field label="عدد محاولات OTP المسموحة" placeholder="5" icon="pin" />
            </Card>
          </div>
        ) : null}

        {tab === "البيانات والخصوصية" ? (
          <div className="flex flex-col gap-md">
            <Table head={["نوع البيانات", "مدة الاحتفاظ", "الإجراء", ""]}>
              {retentionPolicies.map((p) => (
                <tr key={p.id} className="transition hover:bg-surface-container-low">
                  <Td>{p.data}</Td>
                  <Td><Badge tone="info">{p.period}</Badge></Td>
                  <Td>{p.action}</Td>
                  <Td>
                    {p.locked ? (
                      <Badge tone="neutral"><Icon name="lock" className="text-[14px]" />مقفول</Badge>
                    ) : (
                      <Button variant="outline" icon="edit" className="!px-3 !py-1.5">تعديل</Button>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
            <Card className="flex flex-col gap-sm p-md">
              <SectionTitle title="حقوق المستخدمين" icon="privacy_tip" />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" icon="download">تصدير بيانات مستخدم</Button>
                <Button variant="outline" icon="person_off">إخفاء هوية حساب</Button>
                <Button variant="danger" icon="delete">حذف حساب بعد الموافقة</Button>
              </div>
              <p className="flex items-start gap-1 font-label-md text-label-md text-outline">
                <Icon name="info" className="text-[16px]" />
                السجلات المالية لا تُحذف حتى بعد حذف الحساب، ويتم إخفاء الهوية بدلاً من الحذف.
              </p>
            </Card>
          </div>
        ) : null}

        {tab === "التشغيل" ? (
          <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
            <Card className="flex flex-col gap-sm p-md">
              <SectionTitle title="قواعد الطلبات" icon="receipt_long" />
              <Field label="مهلة قبول المطعم للطلب (دقيقة)" placeholder="5" icon="timer" />
              <Field label="مهلة قبول المندوب للعرض (ثانية)" placeholder="30" icon="hourglass_top" />
              <Field label="أقصى مسافة توصيل (كم)" placeholder="15" icon="route" />
              <Field label="مدة السماح بالإلغاء (دقيقة)" placeholder="2" icon="cancel" />
            </Card>
            <Card className="flex flex-col gap-sm p-md">
              <SectionTitle title="التسويات" icon="account_balance" />
              <Field label="دورة التسوية" placeholder="أسبوعية — كل أحد" icon="event_repeat" />
              <Field label="أقل مبلغ للتحويل (ج.م)" placeholder="200" icon="payments" />
              <Field label="مدة تنفيذ التحويل (ساعة)" placeholder="24" icon="schedule" />
              <p className="flex items-start gap-1 font-label-md text-label-md text-outline">
                <Icon name="info" className="text-[16px]" />
                كل تغيير هنا يُسجّل في سجل التدقيق.
              </p>
            </Card>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
