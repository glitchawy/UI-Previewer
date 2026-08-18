import { createFileRoute } from "@tanstack/react-router";
import { AppBar, Badge, Button, Card, Icon, MobileShell, StatusBadge } from "@/components/tb/shell";
import { driverTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/driver/documents")({
  head: () => ({
    meta: [
      { title: "مركز التوثيق | طلبات بيتك" },
      { name: "description", content: "تابع حالة مستنداتك وأعد رفعها عند الحاجة." },
      { property: "og:title", content: "مركز التوثيق | طلبات بيتك" },
      { property: "og:description", content: "تابع حالة مستنداتك وأعد رفعها عند الحاجة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DriverDocuments,
});

const docs = [
  { label: "صورة الرقم القومي (وجه)", status: "APPROVED" as const },
  { label: "صورة الرقم القومي (ظهر)", status: "APPROVED" as const },
  { label: "الفيش والتشبيه", status: "UNDER_REVIEW" as const },
  { label: "رخصة القيادة", status: "REJECTED" as const, reason: "الصورة غير واضحة" },
];

const steps = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"];
const stepLabels: Record<string, string> = {
  PENDING: "قيد الإرسال",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  SUSPENDED: "موقوف",
};

const statusText: Record<string, string> = {
  APPROVED: "مقبول",
  UNDER_REVIEW: "قيد المراجعة",
  REJECTED: "مرفوض",
};

function DriverDocuments() {
  return (
    <MobileShell tabs={driverTabs}>
      <AppBar title="مركز التوثيق" />
      <div className="tb-fade-up flex flex-col gap-md p-md">
        <div>
          <p className="mb-2 font-label-lg text-label-lg text-on-surface">مسار المراجعة</p>
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-1">
                <div className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full font-label-md text-[11px] ${
                      s === "UNDER_REVIEW" ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-center font-label-md text-[10px] text-on-surface-variant">{stepLabels[s]}</span>
                </div>
                {i < steps.length - 1 ? <span className="h-0.5 flex-1 bg-outline-variant" /> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="tb-stagger flex flex-col gap-2">
          {docs.map((d) => (
            <Card key={d.label} className="flex flex-col gap-2 p-md">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
                  <Icon name="description" className="text-[18px] text-on-surface-variant" />
                  {d.label}
                </span>
                <StatusBadge status={d.status} label={statusText[d.status]} />
              </div>
              {d.status === "REJECTED" ? (
                <>
                  <p className="font-label-md text-label-md text-on-error-container">سبب الرفض: {d.reason}</p>
                  <Button variant="outline" icon="upload" className="w-full">إعادة الرفع</Button>
                </>
              ) : null}
            </Card>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-card bg-error-container/60 p-md">
          <Icon name="warning" className="mt-0.5 text-[18px] text-on-error-container" />
          <p className="font-label-md text-label-md text-on-error-container">
            في حالة رفض أي مستند بشكل متكرر أو مخالفة سياسة المنصة، قد يتم إيقاف الحساب مؤقتاً.
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
