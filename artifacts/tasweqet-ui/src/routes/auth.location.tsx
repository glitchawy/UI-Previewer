import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Button, Icon, MapCanvas } from "@/components/tb/shell";

export const Route = createFileRoute("/auth/location")({
  head: () => ({
    meta: [
      { title: "تحديد الموقع | طلبات بيتك" },
      { name: "description", content: "حدد موقعك الحالي وعنوانك عشان نوصلك طلباتك بسرعة." },
      { property: "og:title", content: "تحديد الموقع | طلبات بيتك" },
      { property: "og:description", content: "حدد موقعك الحالي وعنوانك عشان نوصلك طلباتك بسرعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthLocation,
});

function AuthLocation() {
  return (
    <AuthShell title="عنوان التوصيل" subtitle="حدد موقعك عشان نوصلك بأسرع وقت">
      <MapCanvas height="h-56">
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="location_on" className="tb-pulse-ring text-[36px] text-error" filled />
        </div>
      </MapCanvas>

      <Button variant="outline" className="w-full" icon="my_location">
        تحديد موقعي الحالي
      </Button>

      <div className="flex items-start gap-2 rounded-card bg-surface-container-low p-md">
        <Icon name="place" className="mt-0.5 text-[18px] text-on-surface-variant" />
        <div>
          <p className="font-body-md text-body-md text-on-surface">٧ شارع ٩، المعادي، الدور ٣، شقة ٦</p>
          <p className="font-label-md text-label-md text-on-surface-variant">تم تحديد العنوان تلقائياً</p>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">المنطقة</span>
        <select className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-secondary">
          <option>المعادي</option>
          <option>مدينة نصر</option>
          <option>الدقي</option>
          <option>مصر الجديدة</option>
        </select>
      </label>

      <div className="flex items-center gap-2 rounded-card bg-primary-container/60 p-md">
        <Icon name="info" className="text-[18px] text-on-primary-container" />
        <p className="font-label-md text-label-md text-on-primary-container">يمكن حفظ عنوان واحد فقط</p>
      </div>

      <Link to="/app">
        <Button className="w-full" icon="check_circle">تأكيد ومتابعة</Button>
      </Link>
    </AuthShell>
  );
}
