import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  getGetAvailableDriverOrderQueryKey,
  useAcceptDriverOrder,
  useGetAvailableDriverOrder,
  useRejectDriverOrder,
} from "@workspace/api-client-react";
import { AppBar, Button, Card, EmptyState, Icon, MobileShell } from "@/components/tb/shell";
import { runStickyAction } from "@/lib/tb/single-submission";
import { useTranslation, translate } from "@/lib/i18n";
import { formatCurrency } from "@/lib/tb/locale-format";

export const Route = createFileRoute("/driver/offer")({
  head: () => ({
    meta: [
       { title: translate("عرض توصيل جديد | طلبات بيتك", "New delivery offer | Talabat Betak") },
       { name: "description", content: translate("راجع تفاصيل عرض التوصيل الجديد وقرر القبول أو الرفض.", "Review the new delivery offer and accept or reject it.") },
    ],
  }),
  component: DriverOffer,
});

function DriverOffer() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const offerQuery = useGetAvailableDriverOrder({
    query: { queryKey: getGetAvailableDriverOrderQueryKey(), refetchInterval: 15_000 },
  });
  const accept = useAcceptDriverOrder();
  const reject = useRejectDriverOrder();
  const offer = offerQuery.data;
  const [remaining, setRemaining] = useState(0);
  const actionLock = useRef(false);
  const [actionLocked, setActionLocked] = useState(false);
  const authoritativeOfferKey = offer ? `${offer.id}:${offer.offerId}` : null;
  const previousOfferKey = useRef(authoritativeOfferKey);
  useEffect(() => {
    if (previousOfferKey.current !== authoritativeOfferKey) {
      previousOfferKey.current = authoritativeOfferKey;
      actionLock.current = false;
      setActionLocked(false);
    }
  }, [authoritativeOfferKey]);
  useEffect(() => {
    if (!offer) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.ceil((new Date(offer.expiresAt).getTime() - Date.now()) / 1000)));
    tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer);
  }, [offer]);

  async function acceptOffer() {
    if (!offer) return;
    await runStickyAction({
      lock: actionLock,
      submit: () => accept.mutateAsync({ id: offer.id }),
      onStart: () => setActionLocked(true),
      onSuccess: () => navigate({ to: "/driver/navigate" }),
      onError: () => { setActionLocked(false); void offerQuery.refetch(); },
    });
  }
  async function rejectOffer() {
    if (!offer) return;
    await runStickyAction({
      lock: actionLock,
      submit: () => reject.mutateAsync({ id: offer.id }),
      onStart: () => setActionLocked(true),
      onSuccess: () => navigate({ to: "/driver" }),
      onError: () => { setActionLocked(false); void offerQuery.refetch(); },
    });
  }

  return (
    <MobileShell>
       <AppBar title={t("عرض توصيل جديد", "New delivery offer")} back="/driver" />
      {offerQuery.isLoading ? (
        <div className="flex h-72 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[38px] text-primary" /></div>
      ) : offerQuery.isError ? (
         <div className="p-md"><Card className="p-lg text-center text-error"><p>{t("تعذر تحميل العرض", "Could not load offer")}</p><Button className="mt-sm" onClick={() => offerQuery.refetch()}>{t("إعادة المحاولة", "Try again")}</Button></Card></div>
      ) : !offer ? (
         <div className="p-md"><EmptyState icon="notifications_none" title={t("مفيش عرض متاح حالياً", "No offer is available")} body={t("قد يكون العرض انتهى أو يتم توجيهه لكابتن أقرب", "The offer may have expired or been sent to a closer driver")} /></div>
      ) : (
        <div className="tb-fade-up flex flex-col gap-md p-md">
          <Card className="flex items-center gap-3 border-primary bg-primary-container/20 p-md">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-on-primary"><Icon name="two_wheeler" /></span>
             <div><p className="font-headline-md text-headline-md">{t("طلب جاهز للتوصيل", "Order ready for delivery")}</p><p className="font-label-md text-label-md text-on-surface-variant">{offer.code}</p></div>
          </Card>

          <Card className="flex flex-col gap-3 p-md">
            <div className="flex items-start gap-2">
              <Icon name="storefront" className="mt-0.5 text-[19px] text-primary" />
               <div><p className="font-label-md text-label-md text-on-surface-variant">{t("الاستلام من", "Pick up from")}</p><p className="font-label-lg text-label-lg">{offer.restaurantName}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="location_on" className="mt-0.5 text-[19px] text-error" />
               <div><p className="font-label-md text-label-md text-on-surface-variant">{t("التسليم إلى", "Deliver to")}</p><p className="font-label-lg text-label-lg">{offer.deliveryAddressText}</p></div>
            </div>
          </Card>

          <Card className="grid grid-cols-3 divide-x divide-x-reverse divide-outline-variant p-md text-center">
             <div><p className="font-headline-md text-headline-md">{formatCurrency(offer.total, locale)}</p><p className="font-label-md text-label-md text-on-surface-variant">{t("قيمة الطلب", "Order value")}</p></div>
             <div><p className="font-headline-md text-headline-md">{formatCurrency(offer.deliveryFee, locale)}</p><p className="font-label-md text-label-md text-on-surface-variant">{t("رسوم التوصيل", "Delivery fee")}</p></div>
             <div><p className="font-headline-md text-headline-md text-primary">{t(`${remaining} ث`, `${remaining}s`)}</p><p className="font-label-md text-label-md text-on-surface-variant">{t("ينتهي العرض", "Offer expires")}</p></div>
          </Card>
           <p className="text-center text-label-md text-on-surface-variant">{t(`يبعد مكان الاستلام ${offer.distanceKm.toFixed(1)} كم`, `Pickup is ${offer.distanceKm.toFixed(1)} km away`)}</p>

           {accept.isError ? <p className="rounded-button bg-error-container px-3 py-2 text-label-md text-on-error-container">{t("العرض لم يعد متاحاً أو لديك توصيلة نشطة.", "The offer is no longer available or you already have an active delivery.")}</p> : null}
          <div className="grid grid-cols-2 gap-sm">
             <Button type="button" variant="danger" className="w-full" icon="close" disabled={actionLocked || accept.isPending || reject.isPending} onClick={() => void rejectOffer()}>{t("رفض", "Reject")}</Button>
             <Button type="button" className="w-full" icon="check" disabled={actionLocked || accept.isPending || reject.isPending || remaining === 0} onClick={() => void acceptOffer()}>{t("قبول", "Accept")}</Button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}