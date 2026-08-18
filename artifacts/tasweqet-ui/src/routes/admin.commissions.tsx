import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, DashboardShell, Field, Icon, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, restaurants } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/commissions")({
  head: () => ({
    meta: [
      { title: "العمولات | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "إدارة نسب عمولة كل مطعم على قيمة الطلب." },
      { property: "og:title", content: "العمولات | طلبات بيتك" },
      { property: "og:description", content: "إدارة عمولات المطاعم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCommissions,
});

function AdminCommissions() {
  const [defaultRate, setDefaultRate] = useState(15);

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="العمولات">
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex items-center gap-2 bg-secondary-container p-md text-on-secondary-container">
          <Icon name="info" />
          <span className="font-label-lg text-label-lg">
            العمولة تُحسب على قيمة الطلب فقط ولا تشمل رسوم التوصيل — والإدارة وحدها تحددها لكل مطعم.
          </span>
        </Card>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
          <Card className="p-md lg:col-span-2">
            <SectionTitle title="عمولة كل مطعم" icon="percent" />
            <Table head={["المطعم", "النسبة الحالية", "تطبق على", "آخر تحديث", ""]}>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <Td>{r.name}</Td>
                  <Td>
                    <span className="font-label-lg text-label-lg text-on-surface">{r.commission}%</span>
                  </Td>
                  <Td>
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      قيمة الطلب فقط
                    </span>
                  </Td>
                  <Td>12 أغسطس 2026</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        defaultValue={r.commission}
                        aria-label={`نسبة عمولة ${r.name}`}
                        className="w-16 rounded-button border border-outline-variant bg-surface px-2 py-1 font-body-md text-body-md text-on-surface"
                      />
                      <Button variant="primary" icon="save">
                        حفظ
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <div className="flex flex-col gap-md">
            <Card className="p-md">
              <SectionTitle title="النسبة الافتراضية" icon="settings" />
              <p className="mb-sm font-body-md text-body-md text-on-surface-variant">
                تُطبق على أي مطعم جديد يتم توثيقه.
              </p>
              <input
                type="range"
                min={5}
                max={30}
                value={defaultRate}
                onChange={(e) => setDefaultRate(Number(e.target.value))}
                className="w-full accent-secondary"
                aria-label="النسبة الافتراضية"
              />
              <p className="mt-sm font-headline-md text-headline-md text-on-surface">{defaultRate}%</p>
              <Button variant="primary" icon="check" className="mt-sm w-full">
                تحديث الافتراضي
              </Button>
            </Card>

            <Card className="p-md">
              <SectionTitle title="مثال محسوب" icon="calculate" />
              <div className="flex flex-col gap-1.5 font-body-md text-body-md">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">قيمة الطلب</span>
                  <span>{EGP(500)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">رسوم التوصيل (لا تدخل الحساب)</span>
                  <span>{EGP(30)}</span>
                </div>
                <div className="flex justify-between border-t border-outline-variant pt-1.5 font-label-lg text-label-lg text-on-surface">
                  <span>عمولة المنصة 15%</span>
                  <span>{EGP(75)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">المستحق للمطعم</span>
                  <span>{EGP(425)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-md">
              <SectionTitle title="تعديل جماعي" icon="tune" />
              <div className="flex flex-col gap-sm">
                <Field label="النسبة الجديدة (%)" placeholder="15" />
                <Button variant="outline" icon="playlist_add_check">
                  تطبيق على كل المطاعم
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
