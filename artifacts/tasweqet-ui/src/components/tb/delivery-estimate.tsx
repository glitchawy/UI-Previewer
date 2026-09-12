import { Badge, Card, Icon } from "@/components/tb/shell";
import { useTranslation } from "@/lib/i18n";
import { formatEstimateNumber, maxDeliveryEstimate, normalizeDeliveryEstimate, type DeliveryEstimate } from "@/lib/tb/delivery-estimate";

type EstimateLineProps = {
  estimate: unknown;
  className?: string;
  testId?: string;
};

function EstimateContent({ estimate, testId = "delivery-estimate" }: { estimate: DeliveryEstimate; testId?: string }) {
  const { t, locale } = useTranslation();
  const preparation = formatEstimateNumber(estimate.preparationMinutes, locale);
  const travel = formatEstimateNumber(estimate.travelMinutes, locale);
  const total = formatEstimateNumber(estimate.totalMinutes, locale);

  return (
    <div className="min-w-0" data-testid={testId}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">
          <Icon name="schedule" className="text-[15px]" />
          {t(`تقريباً ${total} دقيقة`, `Approx. ${total} min`)}
        </Badge>
      </div>
      <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
        {t(`${preparation} دقيقة تحضير + ${travel} دقيقة انتقال`, `${preparation} min prep + ${travel} min travel`)}
      </p>
    </div>
  );
}

export function DeliveryEstimateLine({ estimate, className = "", testId = "delivery-estimate" }: EstimateLineProps) {
  const { t } = useTranslation();
  const normalized = normalizeDeliveryEstimate(estimate);
  if (!normalized) {
    return (
      <div className={`flex items-center gap-2 text-on-surface-variant ${className}`} data-testid={`${testId}-fallback`}>
        <Icon name="schedule" className="text-[18px]" />
        <span className="font-label-md text-label-md">{t("الوقت المتوقع للتوصيل: ٣٠ دقيقة – ساعة", "Estimated delivery: 30 minutes–1 hour")}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <Icon name="schedule" className="mt-0.5 text-[18px] text-secondary" />
      <EstimateContent estimate={normalized} testId={testId} />
    </div>
  );
}

export function DeliveryEstimateSummary({ estimates, className = "", testId = "delivery-estimate-summary" }: { estimates: unknown[]; className?: string; testId?: string }) {
  const { t } = useTranslation();
  const longest = maxDeliveryEstimate(estimates);
  if (!longest) {
    return (
      <Card className={`flex items-center gap-2 bg-surface-container-low p-md ${className}`} data-testid={`${testId}-fallback`}>
        <Icon name="schedule" className="text-[20px] text-on-surface-variant" />
        <span className="font-label-md text-label-md text-on-surface-variant">{t("الوقت المتوقع للتوصيل: ٣٠ دقيقة – ساعة", "Estimated delivery: 30 minutes–1 hour")}</span>
      </Card>
    );
  }

  return (
    <Card className={`p-md ${className}`} data-testid={testId}>
      <p className="mb-2 font-label-lg text-label-lg">{t("أقصى مدة تقريبية للطلبات", "Approximate time for all orders")}</p>
      <EstimateContent estimate={longest} testId={`${testId}-value`} />
    </Card>
  );
}

export function DeliveryEstimateCard({ estimate, title, className = "", testId = "delivery-estimate-card" }: EstimateLineProps & { title: string }) {
  return (
    <Card className={`p-md ${className}`} data-testid={testId}>
      <p className="mb-2 font-label-lg text-label-lg">{title}</p>
      <DeliveryEstimateLine estimate={estimate} testId={`${testId}-value`} />
    </Card>
  );
}
