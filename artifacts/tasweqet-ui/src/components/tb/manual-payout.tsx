import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  SectionTitle,
} from "@/components/tb/shell";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/tb/locale-format";
import {
  isPayoutDestinationValid,
  loadPrivatePayoutProof,
  payoutChannelLabel,
  payoutFeeForChannel,
  payoutGross,
  payoutNet,
  payoutNetPreview,
  payoutProofPath,
  payoutStatusLabel,
  payoutStatusTone,
  PAYOUT_CHANNELS,
  type ManualPayoutCreate,
  type ManualPayoutRequest,
  type PayoutChannel,
  type PayoutClient,
  type PayoutDestination,
  type PayoutResponse,
} from "@/lib/manual-payout";

const POLL_INTERVAL_MS = 30_000;

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `payout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function destinationText(
  request: ManualPayoutRequest,
  t: (ar: string, en: string) => string,
): string {
  const destination = request.destination;
  if (request.channel === "instapay") {
    return `${destination.accountName} · ${destination.instapayAddress ?? "—"}`;
  }
  if (request.channel === "mobile_wallet") {
    return `${destination.accountName} · ${destination.mobileNumber ?? "—"}`;
  }
  return `${destination.accountName} · ${t("فرع", "Branch")}: ${destination.branch ?? "—"}`;
}

function Metric({
  label,
  value,
  tone = "text-on-surface",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-card bg-surface-container-low p-md">
      <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
      <p className={`mt-1 font-headline-md text-headline-md ${tone}`}>{value}</p>
    </div>
  );
}

function DestinationFields({
  channel,
  destination,
  onChange,
}: {
  channel: PayoutChannel;
  destination: PayoutDestination;
  onChange: (destination: PayoutDestination) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-md md:grid-cols-2">
      <Field
        label={t("اسم صاحب الحساب", "Account name")}
        value={destination.accountName}
        onChange={(event) => onChange({ ...destination, accountName: event.target.value })}
        hint={t("اكتب الاسم كما يظهر في وسيلة الاستلام.", "Use the name shown on the receiving account.")}
      />
      {channel === "instapay" ? (
        <Field
          label={t("عنوان إنستاباي", "Instapay address")}
          value={destination.instapayAddress ?? ""}
          onChange={(event) => onChange({ ...destination, instapayAddress: event.target.value })}
          placeholder="@name أو رقم الهاتف"
          required
        />
      ) : null}
      {channel === "mobile_wallet" ? (
        <Field
          label={t("رقم المحفظة", "Wallet phone number")}
          type="tel"
          value={destination.mobileNumber ?? ""}
          onChange={(event) => onChange({ ...destination, mobileNumber: event.target.value })}
          placeholder="01xxxxxxxxx"
          required
        />
      ) : null}
      {channel === "cash_branch" ? (
        <Field
          label={t("فرع الاستلام", "Collection branch")}
          value={destination.branch ?? ""}
          onChange={(event) => onChange({ ...destination, branch: event.target.value })}
          hint={t("سيتم إرفاق إيصال نقدي موقّع عند الدفع.", "A signed cash receipt is required when paid.")}
          required
        />
      ) : null}
    </div>
  );
}

function PayoutStatusCard({
  request,
  onCancel,
  onViewProof,
  proofUrl,
  proofError,
  cancelling,
}: {
  request: ManualPayoutRequest;
  onCancel: (request: ManualPayoutRequest) => void;
  onViewProof: (request: ManualPayoutRequest) => void;
  proofUrl?: string;
  proofError?: string;
  cancelling: boolean;
}) {
  const { t, locale } = useTranslation();
  const proofPath = payoutProofPath(request);
  return (
    <Card className="p-md">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <p className="font-label-lg text-label-lg text-on-surface">
            {payoutChannelLabel(request.channel, t)}
          </p>
          <p className="font-label-md text-label-md text-on-surface-variant">
            {destinationText(request, t)}
          </p>
        </div>
        <Badge tone={payoutStatusTone(request.status)}>
          {payoutStatusLabel(request.status, t)}
        </Badge>
      </div>
      <div className="mt-md grid grid-cols-3 gap-2">
        <Metric label={t("الإجمالي", "Gross")} value={formatCurrency(payoutGross(request), locale)} />
        <Metric label={t("الرسوم", "Fee")} value={formatCurrency(request.fee ?? request.feeAmount ?? 0, locale)} />
        <Metric label={t("الصافي", "Net")} value={formatCurrency(payoutNet(request), locale)} tone="text-success" />
      </div>
      <div className="mt-md flex flex-wrap items-center justify-between gap-sm border-t border-outline-variant pt-sm">
        <span className="font-label-md text-label-md text-on-surface-variant">
          {formatDateTime(request.createdAt, locale)}
        </span>
        <div className="flex flex-wrap gap-2">
          {request.status === "pending" ? (
            <Button
              variant="outline"
              disabled={cancelling}
              onClick={() => onCancel(request)}
            >
              {cancelling ? t("جارٍ الإلغاء…", "Cancelling…") : t("إلغاء الطلب", "Cancel request")}
            </Button>
          ) : null}
          {request.status === "paid" && proofPath ? (
            <Button variant="ghost" onClick={() => onViewProof(request)}>
              <Icon name="image" />
              {t("عرض إثبات الدفع", "View payment proof")}
            </Button>
          ) : null}
        </div>
      </div>
      {request.reason || request.decisionReason || request.rejectionReason || request.adminNote ? (
        <p className="mt-sm rounded-button bg-surface-container-low p-sm font-body-md text-body-md text-on-surface-variant">
          {t("ملاحظة الإدارة:", "Admin note:")}{" "}
          {request.decisionReason ?? request.rejectionReason ?? request.adminNote ?? request.reason}
        </p>
      ) : null}
      {proofError ? <p className="mt-sm text-label-md text-error">{proofError}</p> : null}
      {proofUrl ? (
        <img
          src={proofUrl}
          alt={t("صورة إثبات الدفع", "Payment proof")}
          className="mt-md max-h-72 w-full rounded-card border border-outline-variant object-contain"
        />
      ) : null}
    </Card>
  );
}

export function PayoutRequestPanel({
  client,
  title,
}: {
  client: PayoutClient;
  title?: string;
}) {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<PayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [channel, setChannel] = useState<PayoutChannel>("instapay");
  const [destination, setDestination] = useState<PayoutDestination>({ accountName: "" });
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [cancellingId, setCancellingId] = useState<number | string | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [proofErrors, setProofErrors] = useState<Record<string, string>>({});
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await client.get());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("تعذر تحميل التحويلات", "Unable to load payouts"));
    } finally {
      setLoading(false);
    }
  }, [client, t]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(
    () => () => {
      Object.values(proofUrls).forEach((url) => URL.revokeObjectURL(url));
    },
    [proofUrls],
  );

  const summary = data?.summary ?? null;
  const available = summary?.available ?? 0;
  const fee = payoutFeeForChannel(summary, channel, data?.settings);
  const feePayer = data?.settings?.defaultFeePayer ?? summary?.feePayer ?? "recipient";
  const net = payoutNetPreview(available, fee, feePayer);
  const destinationValid = isPayoutDestinationValid(channel, destination);
  const canRequest = available > 0 && net > 0 && destinationValid;
  const requestHistory = data?.requests ?? [];
  const idKey = String(idempotencyKey);

  const submit = async () => {
    if (!canRequest || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    const body: ManualPayoutCreate = { channel, destination, idempotencyKey: idKey };
    try {
      await client.create(body);
      setDestination({ accountName: "" });
      setConfirming(false);
      setIdempotencyKey(newIdempotencyKey());
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("تعذر إنشاء الطلب", "Unable to create the request"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const cancel = async (request: ManualPayoutRequest) => {
    if (request.status !== "pending" || cancellingId !== null) return;
    if (!window.confirm(t("هل تريد إلغاء طلب التحويل؟", "Cancel this payout request?"))) return;
    setCancellingId(request.id);
    setError("");
    try {
      await client.cancel(request.id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("تعذر إلغاء الطلب", "Unable to cancel request"));
    } finally {
      setCancellingId(null);
    }
  };

  const viewProof = async (request: ManualPayoutRequest) => {
    const path = payoutProofPath(request);
    if (!path) return;
    const key = String(request.id);
    setProofErrors((previous) => ({ ...previous, [key]: "" }));
    try {
      const url = await loadPrivatePayoutProof(path);
      setProofUrls((previous) => ({ ...previous, [key]: url }));
    } catch (cause) {
      setProofErrors((previous) => ({
        ...previous,
        [key]: cause instanceof Error ? cause.message : t("تعذر تحميل الإثبات", "Unable to load proof"),
      }));
    }
  };

  return (
    <section className="tb-stagger flex flex-col gap-md">
      <SectionTitle
        title={title ?? t("طلب تحويل الأرباح", "Request a payout")}
        icon="account_balance_wallet"
      />
      <Card className="p-md">
        <div className="grid gap-2 sm:grid-cols-4">
          <Metric label={t("المتاح للسحب", "Available")} value={formatCurrency(available, locale)} tone="text-success" />
          <Metric label={t("محجوز", "Reserved")} value={formatCurrency(summary?.reserved ?? 0, locale)} />
          <Metric label={t("معتمد", "Approved")} value={formatCurrency(summary?.approved ?? 0, locale)} />
          <Metric label={t("مدفوع تاريخياً", "Paid to date")} value={formatCurrency(summary?.paid ?? 0, locale)} />
        </div>
        <p className="mt-md rounded-button bg-surface-container-low p-sm font-body-md text-body-md text-on-surface-variant">
          {t(
            "يمكنك طلب كامل المبلغ المتاح فقط. لا يمكن إدخال مبلغ مخصص، ويجب أن يكون صافي التحويل موجباً.",
            "A payout always requests the full available amount. Custom amounts are not supported and the net must be positive.",
          )}
        </p>
      </Card>

      <Card className="p-md">
        <div className="mb-md">
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {t("بيانات الاستلام", "Receiving details")}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("سيتم حفظ الرسوم وبيانات الوجهة كلقطة ثابتة مع الطلب.", "The fee and destination are snapshotted with this request.")}
          </p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="font-label-lg text-label-lg text-on-surface-variant">
            {t("طريقة التحويل", "Payout channel")}
          </span>
          <select
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value as PayoutChannel);
              setDestination((previous) => ({ accountName: previous.accountName }));
              setConfirming(false);
            }}
            className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-secondary"
          >
            {PAYOUT_CHANNELS.map((value) => (
              <option key={value} value={value}>
                {payoutChannelLabel(value, t)}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-md">
          <DestinationFields
            channel={channel}
            destination={destination}
            onChange={(next) => {
              setDestination(next);
              setConfirming(false);
            }}
          />
        </div>
        <div className="mt-md grid gap-2 sm:grid-cols-3">
          <Metric label={t("الإجمالي", "Gross")} value={formatCurrency(available, locale)} />
          <Metric label={t("رسوم القناة", "Channel fee")} value={formatCurrency(fee, locale)} />
          <Metric
            label={t("الصافي المتوقع", "Estimated net")}
            value={formatCurrency(net, locale)}
            tone={net > 0 ? "text-success" : "text-error"}
          />
        </div>
        <p className="mt-sm font-label-md text-label-md text-on-surface-variant">
          {feePayer === "recipient"
            ? t("يُخصم الرسم من مستحقاتك.", "The fee is deducted from your payout.")
            : t("تتحمل المنصة الرسم؛ يصلك كامل الإجمالي.", "The platform covers the fee; you receive the full gross.")}
        </p>
        {error ? <p className="mt-md text-body-md text-error">{error}</p> : null}
        {!canRequest && available > 0 && destinationValid ? (
          <p className="mt-md text-body-md text-error">
            {t("صافي المبلغ بعد الرسم يجب أن يكون أكبر من صفر.", "The net amount after the fee must be greater than zero.")}
          </p>
        ) : null}
        {confirming ? (
          <div className="mt-md rounded-card border-2 border-primary-container bg-primary-container/20 p-md">
            <p className="font-label-lg text-label-lg text-on-surface">
              {t("تأكيد طلب التحويل", "Confirm payout request")}
            </p>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              {t(
                `سيتم طلب ${formatCurrency(available, locale)} إلى ${destination.accountName} دون إمكانية تعديل المبلغ.`,
                `You will request ${formatCurrency(available, locale)} to ${destination.accountName}; the amount cannot be edited.`,
              )}
            </p>
            <div className="mt-md flex flex-wrap gap-2">
              <Button disabled={submitting} onClick={() => void submit()}>
                {submitting ? t("جارٍ الإرسال…", "Submitting…") : t("تأكيد وإرسال", "Confirm and submit")}
              </Button>
              <Button variant="ghost" disabled={submitting} onClick={() => setConfirming(false)}>
                {t("رجوع", "Back")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="mt-md w-full sm:w-auto"
            disabled={loading || submitting || !canRequest}
            onClick={() => setConfirming(true)}
            icon="send"
          >
            {t("طلب كامل المبلغ المتاح", "Request full available amount")}
          </Button>
        )}
      </Card>

      <div>
        <SectionTitle title={t("سجل طلبات التحويل", "Payout history")} icon="history" />
        {loading ? (
          <Card className="p-lg text-center text-on-surface-variant">
            {t("جارٍ تحميل الطلبات…", "Loading payout requests…")}
          </Card>
        ) : requestHistory.length === 0 ? (
          <Card className="p-lg">
            <EmptyState
              icon="payments"
              title={t("لا توجد طلبات تحويل", "No payout requests")}
              body={t("ستظهر الطلبات وحالاتها هنا بعد أول طلب.", "Requests and their statuses will appear here after your first request.")}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-sm">
            {requestHistory.map((request) => (
              <PayoutStatusCard
                key={request.id}
                request={request}
                onCancel={(item) => void cancel(item)}
                onViewProof={(item) => void viewProof(item)}
                proofUrl={proofUrls[String(request.id)]}
                proofError={proofErrors[String(request.id)]}
                cancelling={cancellingId === request.id}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function createPayoutClient(
  get: () => Promise<PayoutResponse>,
  create: (body: ManualPayoutCreate) => Promise<ManualPayoutRequest>,
  cancel: (id: number | string) => Promise<ManualPayoutRequest>,
): PayoutClient {
  return { get, create, cancel };
}