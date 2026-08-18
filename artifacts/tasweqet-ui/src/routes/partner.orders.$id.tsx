import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DashboardShell,
  Card,
  SectionTitle,
  Badge,
  StatusBadge,
  Button,
  Icon,
  Table,
  Td,
} from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { EGP, orderOf, orderHistory, stateLabels, drivers } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/orders/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الطلب — طلبات بيتك" },
      { name: "description", content: "متابعة حالة الطلب وتفاصيله الكاملة." },
      { property: "og:title", content: "تفاصيل الطلب — طلبات بيتك" },
      { property: "og:description", content: "متابعة حالة الطلب وتفاصيله الكاملة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerOrderDetail,
});

const flow = ["PLACED", "CONFIRMED", "PREPARING", "READY", "ASSIGNED", "PICKED_UP"];

function PartnerOrderDetail() {
  const { id } = Route.useParams();
  const order = orderOf(id);
  const sub = order.subOrders[0];
  const currentIdx = flow.indexOf(order.status);
  const restaurantDrivers = drivers.filter((d) => d["type"] === "RESTAURANT");

  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title={`طلب ${order.code}`}>
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="flex items-center justify-between">
          <Link to="/partner/orders" className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface">
            <Icon name="arrow_forward" className="text-[18px]" />
            رجوع للطلبات
          </Link>
          <StatusBadge status={order.status} label={stateLabels[order.status]} />
        </div>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
          <div className="flex flex-col gap-md lg:col-span-2">
            <Card className="p-md">
              <SectionTitle title="عناصر الطلب" icon="restaurant_menu" />
              <Table head={["الصنف", "الكمية", "السعر"]}>
                {sub?.items.map((it, i) => (
                  <tr key={i}>
                    <Td>{it.name}</Td>
                    <Td>{it.qty}</Td>
                    <Td>{EGP(it.price)}</Td>
                  </tr>
                ))}
              </Table>
              <div className="mt-md flex flex-col gap-1.5 border-t border-outline-variant pt-md font-body-md text-body-md">
                <div className="flex justify-between"><span className="text-on-surface-variant">الإجمالي الفرعي</span><span>{EGP(sub?.subtotal ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">رسوم التوصيل</span><span>{EGP(sub?.deliveryFee ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">عمولة المنصة</span><span>{EGP(order.commission)}</span></div>
                <div className="flex justify-between font-label-lg text-label-lg text-on-surface"><span>الصافي</span><span>{EGP(order.total - order.commission)}</span></div>
              </div>
            </Card>

            <Card className="p-md">
              <SectionTitle title="حالة الطلب" icon="task_alt" />
              <div className="flex flex-wrap gap-2">
                {flow.map((s, i) => {
                  const isNext = i === currentIdx + 1;
                  const isDone = i <= currentIdx;
                  return (
                    <Button
                      key={s}
                      variant={isNext ? "primary" : "outline"}
                      disabled={!isNext}
                      className={isDone && !isNext ? "opacity-50" : ""}
                    >
                      {stateLabels[s]}
                    </Button>
                  );
                })}
              </div>
              <p className="mt-sm font-label-md text-label-md text-outline">
                المطعم يتحكم فقط في المراحل من "تم الطلب" حتى "تم الاستلام".
              </p>
            </Card>

            <Card className="p-md">
              <SectionTitle title="التوصيل" icon="delivery_dining" />
              {sub?.deliveryProvider === "TALABAT_BETAK" ? (
                <div>
                  <Badge tone="info" className="mb-sm">طلب مندوب طلبات بيتك</Badge>
                  <ol className="flex flex-col gap-2">
                    {["البحث عن أقرب مندوب", "إرسال العرض", "قبول / رفض المندوب", "تعيين المندوب للطلب"].map((step, i) => (
                      <li key={step} className="flex items-center gap-2 font-body-md text-body-md text-on-surface">
                        <span className="flex size-6 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px]">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {sub.driver ? (
                    <p className="mt-sm font-label-lg text-label-lg text-success">تم تعيين: {sub.driver}</p>
                  ) : null}
                </div>
              ) : (
                <div>
                  <Badge tone="warn" className="mb-sm">توصيل عن طريق مندوبي المطعم</Badge>
                  <div className="flex flex-col gap-2">
                    {restaurantDrivers.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-button border border-outline-variant p-2">
                        <span className="font-label-lg text-label-lg text-on-surface">{d.name}</span>
                        <Badge tone={d.online ? "success" : "neutral"}>{d.online ? "متاح" : "غير متاح"}</Badge>
                        <Button variant="outline" className="!px-3 !py-1">تعيين</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-md">
            <Card className="p-md">
              <SectionTitle title="بيانات العميل" icon="person" />
              <p className="font-label-lg text-label-lg text-on-surface">{order.customer}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{order.customerPhone}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{order.address}</p>
              <Badge tone="neutral" className="mt-sm">
                <Icon name="privacy_tip" className="text-[14px]" />
                لا يمكن الوصول لقاعدة عملاء المنصة
              </Badge>
            </Card>

            <Card className="p-md">
              <SectionTitle title="سجل الطلب" icon="history" />
              <ol className="flex flex-col gap-3">
                {orderHistory.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary-container" />
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{stateLabels[h.status]}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">{h.actor} · {h.role}</p>
                      <p className="font-label-md text-[11px] text-outline">{h.at}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
