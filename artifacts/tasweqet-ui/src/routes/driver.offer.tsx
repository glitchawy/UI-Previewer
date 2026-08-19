import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  getGetAvailableDriverOrderQueryKey,
  useAcceptDriverOrder,
  useGetAvailableDriverOrder,
} from "@workspace/api-client-react";
import { AppBar, Button, Card, EmptyState, Icon, MobileShell } from "@/components/tb/shell";
import { EGP, driverWallet } from "@/lib/tb/data";

export const Route = createFileRoute("/driver/offer")({
  head: () => ({
    meta: [
      { title: "عرض توصيل جديد | طلبات بيتك" },
      { name: "description", content: "راجع تفاصيل عرض التوصيل الجديد وقرر القبول أو الرفض." },
    ],
  }),
  component: DriverOffer,
});

function DriverOffer() {
  const navigate = useNavigate();
  const offerQuery = useGetAvailableDriverOrder({
    query: { queryKey: getGetAvailableDriverOrderQueryKey(), refetchInterval: 15_000 },
  });
  const accept = useAcceptDriverOrder();
  const offer = offerQuery.data;
  const earnings = offer ? Math.round((offer.deliveryFee * driverWallet["commissionRate"]) / 100) : 0;

  function acceptOffer() {
    if (!offer) return;
    accept.mutate(
      { id: offer.id },
      { onSuccess: () => navigate({ to: "/driver/navigate" }), onError: () => offerQuery.refetch() },
    );
  }

  return (
    <MobileShell>
      <AppBar title="عرض توصيل جديد" back="/driver" />
      {offerQuery.isLoading ? (
        <div className="flex h-72 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[38px] text-primary" /></div>
      ) : !offer ? (
        <div className="p-md"><EmptyState icon="notifications_none" title="مفيش عرض متاح حالياً" body="هنظهرلك أقرب طلب جاهز أول ما يكون متاح" /></div>
      ) : (
        <div className="tb-fade-up flex flex-col gap-md p-md">
          <Card className="flex items-center gap-3 border-primary bg-primary-container/20 p-md">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-on-primary"><Icon name="two_wheeler" /></span>
            <div><p className="font-headline-md text-headline-md">طلب جاهز للتوصيل</p><p className="font-label-md text-label-md text-on-surface-variant">{offer.code}</p></div>
          </Card>

          <Card className="flex flex-col gap-3 p-md">
            <div className="flex items-start gap-2">
              <Icon name="storefront" className="mt-0.5 text-[19px] text-primary" />
              <div><p className="font-label-md text-label-md text-on-surface-variant">الاستلام من</p><p className="font-label-lg text-label-lg">{offer.restaurantName}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="location_on" className="mt-0.5 text-[19px] text-error" />
              <div><p className="font-label-md text-label-md text-on-surface-variant">التسليم إلى</p><p className="font-label-lg text-label-lg">{offer.deliveryAddressText}</p></div>
            </div>
          </Card>

          <Card className="grid grid-cols-3 divide-x divide-x-reverse divide-outline-variant p-md text-center">
            <div><p className="font-headline-md text-headline-md">{EGP(offer.total)}</p><p className="font-label-md text-label-md text-on-surface-variant">قيمة الطلب</p></div>
            <div><p className="font-headline-md text-headline-md">{EGP(offer.deliveryFee)}</p><p className="font-label-md text-label-md text-on-surface-variant">رسوم التوصيل</p></div>
            <div><p className="font-headline-md text-headline-md text-success">{EGP(earnings)}</p><p className="font-label-md text-label-md text-on-surface-variant">أرباحك</p></div>
          </Card>

          {accept.isError ? <p className="rounded-button bg-error-container px-3 py-2 text-label-md text-on-error-container">العرض لم يعد متاحاً أو لديك توصيلة نشطة.</p> : null}
          <div className="grid grid-cols-2 gap-sm">
            <Link to="/driver"><Button variant="danger" className="w-full" icon="close">رفض</Button></Link>
            <Button className="w-full" icon="check" disabled={accept.isPending} onClick={acceptOffer}>قبول</Button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}