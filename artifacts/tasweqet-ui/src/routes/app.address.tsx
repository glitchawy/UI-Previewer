import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Field, Button, MapCanvas } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/address")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | عنوان التوصيل" },
      { name: "description", content: "أدر عنوان التوصيل الخاص بك" },
      { property: "og:title", content: "طلبات بيتك | عنوان التوصيل" },
      { property: "og:description", content: "أدر عنوان التوصيل الخاص بك" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppAddress,
});

function AppAddress() {
  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="عنوان التوصيل" back="/app" />
      <div className="flex flex-col gap-lg p-md">
        <MapCanvas>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
            <Icon name="location_on" className="text-[36px] text-error" filled />
          </span>
        </MapCanvas>
        <Button variant="outline" icon="my_location" className="w-full">
          تحديد موقعي الحالي
        </Button>

        <Card className="flex items-center gap-2 bg-secondary-container p-3 text-on-secondary-container">
          <Icon name="info" className="text-[18px]" />
          <span className="font-label-md text-label-md">طلبات بيتك بتدعم عنوان واحد محفوظ فقط حالياً</span>
        </Card>

        <div className="flex flex-col gap-md">
          <Field label="المنطقة" placeholder="مثال: المعادي" icon="map" value="المعادي" />
          <Field label="الشارع" placeholder="اسم الشارع" icon="signpost" value="شارع ٩" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم العقار" placeholder="٧" value="٧" />
            <Field label="الدور" placeholder="٣" value="٣" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الشقة" placeholder="٦" value="٦" />
            <Field label="رقم الموبايل" placeholder="01xxxxxxxxx" icon="call" value="0100 123 4567" />
          </div>
          <Field label="علامة مميزة" placeholder="بجوار صيدلية..." icon="flag" />
        </div>

        <Link to="/app">
          <Button className="w-full" icon="save">
            حفظ العنوان
          </Button>
        </Link>
      </div>
    </MobileShell>
  );
}
