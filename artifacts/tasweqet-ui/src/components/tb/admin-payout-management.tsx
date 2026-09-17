import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  SectionTitle,
} from "@/components/tb/shell";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/tb/locale-format";
import {
  adminPayoutProof,
  adminPayoutRequest,
  loadPrivatePayoutProof,
  payoutChannelLabel,
  payoutFee,
  payoutGross,
  payoutNet,
  payoutProofPath,
  payoutStatusLabel,
  payoutStatusTone,
  PAYOUT_CHANNELS,
  type AdminPayoutSettings,
  type AdminPayoutSettingsInput,
  type ManualPayoutRequest,
  type PayoutRole,
  type PayoutStatus,
} from "@/lib/manual-payout";
import {
  REFUND_PROOF_MAX_BYTES,
  REFUND_PROOF_MIME_TYPES,
  refundProofValidationError,
} from "@/lib/refund-proof-helpers";

type ActionKind = "approve" | "reject" | "paid";
type FilterStatus = PayoutStatus | "all";
type FilterRole = PayoutRole | "all";

const initialSettings: AdminPayoutSettings = {
  version: 0,
  channels: {
    instapay: { fee: 5 },
    mobile_wallet: { fee: 10 },
    cash_branch: { fee: 100 },
  },
  defaultFeePayer: "recipient",
  updatedAt: null,
};

function isPayoutMimeType(value: string): value is (typeof REFUND_PROOF_MIME_TYPES)[number] {
  return (REFUND_PROOF_MIME_TYPES as readonly string[]).includes(value);
}

function payoutRoleLabel(role: PayoutRole | undefined, t: (ar: string, en: string) => string): string {
  return role === "driver" ? t("مندوب", "Driver") : t("مطعم", "Restaurant");
}

function destinationLabel(item: ManualPayoutRequest, t: (ar: string, en: string) => string): string {
  const destination = item.destination;
  if (item.channel === "instapay") {
    return `${destination.accountName} · ${destination.instapayAddress ?? "—"}`;
  }
  if (item.channel === "mobile_wallet") {
    return `${destination.accountName} · ${destination.mobileNumber ?? "—"}`;
  }
  return `${destination.accountName} · ${t("فرع", "Branch")}: ${destination.branch ?? "—"}`;
}

function settingInputClass(): string {
  return "w-full rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-secondary";
}

export function AdminPayoutManagement() {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<ManualPayoutRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("all");
  const [action, setAction] = useState<{ id: number | string; kind: ActionKind } | null>(null);
  const [reason, setReason] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [submittingId, setSubmittingId] = useState<number | string | null>(null);
  const [uploadingId, setUploadingId] = useState<number | string | null>(null);
  const [signedReceipt, setSignedReceipt] = useState<Record<string, boolean>>({});
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [proofErrors, setProofErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<AdminPayoutSettings>(initialSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsReason, setSettingsReason] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadPayouts = useCallback(async () => {
    setError("");
    const params = new URLSearchParams({ page: "1", pageSize: "50" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (roleFilter !== "all") params.set("role", roleFilter);
    try {
      const response = await adminPayoutRequest<{
        items: ManualPayoutRequest[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>(`/admin/payouts?${params.toString()}`);
      setItems(response.items);
      setTotal(response.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("تعذر تحميل طلبات التحويل", "Unable to load payout requests"));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, t]);

  const loadSettings = useCallback(async () => {
    setSettingsError("");
    try {
      setSettings(await adminPayoutRequest<AdminPayoutSettings>("/admin/payout-settings"));
    } catch (cause) {
      setSettingsError(cause instanceof Error ? cause.message : t("تعذر تحميل إعدادات الرسوم", "Unable to load payout settings"));
    } finally {
      setSettingsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPayouts();
    const timer = window.setInterval(() => void loadPayouts(), 30_000);
    return () => window.clearInterval(timer);
  }, [loadPayouts]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(
    () => () => Object.values(proofUrls).forEach((url) => URL.revokeObjectURL(url)),
    [proofUrls],
  );

  const beginAction = (item: ManualPayoutRequest, kind: ActionKind) => {
    if (kind === "approve" && item.status !== "pending") return;
    if (kind === "reject" && item.status !== "pending" && item.status !== "approved") return;
    if (kind === "paid" && (item.status !== "approved" || !payoutProofPath(item))) return;
    setAction({ id: item.id, kind });
    setReason("");
    setTransferReference("");
  };

  const submitAction = async (item: ManualPayoutRequest) => {
    if (!action || action.id !== item.id || !reason.trim() || submittingId !== null) return;
    if (action.kind === "paid") {
      if (item.status !== "approved" || !payoutProofPath(item)) {
        setError(t("أرفق إثباتاً لطلب معتمد قبل تعليمه كمدفوع.", "Attach proof to an approved request before marking it paid."));
        return;
      }
      if (item.channel !== "cash_branch" && !transferReference.trim()) {
        setError(t("أدخل مرجع التحويل الإلكتروني.", "Enter the electronic transfer reference."));
        return;
      }
      const receiptConfirmed = signedReceipt[String(item.id)] ?? item.proof?.isSignedReceipt ?? false;
      if (item.channel === "cash_branch" && !receiptConfirmed) {
        setError(t("أكد أن الصورة إيصال نقدي موقّع.", "Confirm that the image is a signed cash receipt."));
        return;
      }
    }
    setSubmittingId(item.id);
    setError("");
    try {
      const body = {
        reason: reason.trim(),
        ...(action.kind === "paid" && transferReference.trim()
          ? { transferReference: transferReference.trim() }
          : {}),
      };
      await adminPayoutRequest<ManualPayoutRequest>(`/admin/payouts/${item.id}/${action.kind}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setAction(null);
      await loadPayouts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("تعذر تغيير حالة الطلب", "Unable to change request status"));
    } finally {
      setSubmittingId(null);
    }
  };

  const attachProof = async (item: ManualPayoutRequest, file: File) => {
    if (item.status !== "approved") return;
    const receiptConfirmed = signedReceipt[String(item.id)] ?? item.proof?.isSignedReceipt ?? false;
    if (item.channel === "cash_branch" && !receiptConfirmed) {
      setProofErrors((previous) => ({
        ...previous,
        [String(item.id)]: t("أكد أولاً أن الصورة إيصال نقدي موقّع.", "Confirm first that this is a signed cash receipt."),
      }));
      return;
    }
    const validation = refundProofValidationError(file);
    if (validation) {
      setProofErrors((previous) => ({
        ...previous,
        [String(item.id)]: validation === "type"
          ? t("استخدم JPG أو PNG أو WebP فقط.", "Use JPG, PNG, or WebP only.")
          : t("حجم الصورة يجب ألا يتجاوز 10 ميجابايت.", "The image must be no larger than 10 MB."),
      }));
      return;
    }
    if (!isPayoutMimeType(file.type)) return;
    setUploadingId(item.id);
    setProofErrors((previous) => ({ ...previous, [String(item.id)]: "" }));
    try {
      await adminPayoutProof(
        item.id,
        file,
        item.channel === "cash_branch" && receiptConfirmed,
      );
      await loadPayouts();
    } catch (cause) {
      setProofErrors((previous) => ({
        ...previous,
        [String(item.id)]: cause instanceof Error ? cause.message : t("تعذر رفع الإثبات", "Unable to upload proof"),
      }));
    } finally {
      setUploadingId(null);
    }
  };

  const viewProof = async (item: ManualPayoutRequest) => {
    const path = payoutProofPath(item);
    if (!path) return;
    const key = String(item.id);
    setProofErrors((previous) => ({ ...previous, [key]: "" }));
    try {
      const url = await loadPrivatePayoutProof(path);
      setProofUrls((previous) => ({ ...previous, [key]: url }));
    } catch (cause) {
      setProofErrors((previous) => ({
        ...previous,
        [key]: cause instanceof Error ? cause.message : t("تعذر تحميل صورة الإثبات", "Unable to load the proof image"),
      }));
    }
  };

  const saveSettings = async () => {
    if (!settingsReason.trim() || settingsSaving) return;
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsSaved(false);
    try {
      const body: AdminPayoutSettingsInput = {
        version: settings.version,
        channels: settings.channels,
        defaultFeePayer: settings.defaultFeePayer,
        reason: settingsReason.trim(),
      };
      const next = await adminPayoutRequest<AdminPayoutSettings>("/admin/payout-settings", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setSettings(next);
      setSettingsReason("");
      setSettingsSaved(true);
    } catch (cause) {
      setSettingsError(cause instanceof Error ? cause.message : t("تعذر حفظ إعدادات الرسوم", "Unable to save payout settings"));
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-xl">
      <section>
        <SectionTitle
          title={t("إدارة التحويلات اليدوية", "Manual payout management")}
          icon="payments"
          action={
            <Button variant="ghost" onClick={() => void loadPayouts()}>
              {t("تحديث", "Refresh")}
            </Button>
          }
        />
        <Card className="mb-md grid gap-md p-md sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md text-on-surface-variant">{t("الحالة", "Status")}</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}
              className={settingInputClass()}
            >
              <option value="all">{t("كل الحالات", "All statuses")}</option>
              {(["pending", "approved", "paid", "rejected", "cancelled"] as PayoutStatus[]).map((status) => (
                <option key={status} value={status}>{payoutStatusLabel(status, t)}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md text-on-surface-variant">{t("الدور", "Role")}</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as FilterRole)}
              className={settingInputClass()}
            >
              <option value="all">{t("كل الأدوار", "All roles")}</option>
              <option value="driver">{t("مندوب", "Driver")}</option>
              <option value="partner">{t("مطعم", "Restaurant")}</option>
            </select>
          </label>
          <div className="flex items-end font-label-md text-label-md text-on-surface-variant">
            {t("{count} طلب", "{count} requests", { count: total })}
          </div>
        </Card>
        {error ? <Card className="mb-md p-md text-body-md text-error">{error}</Card> : null}
        {loading ? (
          <Card className="p-lg text-center text-on-surface-variant">{t("جارٍ تحميل طلبات التحويل…", "Loading payout requests…")}</Card>
        ) : items.length === 0 ? (
          <Card className="p-lg text-center text-on-surface-variant">{t("لا توجد طلبات بهذه الفلاتر.", "No payout requests match these filters.")}</Card>
        ) : (
          <div className="flex flex-col gap-sm">
            {items.map((item) => {
              const proofPath = payoutProofPath(item);
              const activeAction = action?.id === item.id ? action : null;
              return (
                <Card key={item.id} className="p-md">
                  <div className="flex flex-wrap items-start justify-between gap-sm">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-label-lg text-label-lg text-on-surface">
                          #{item.id}
                        </span>
                        <Badge tone="neutral">{payoutRoleLabel(item.role ?? item.recipientRole, t)}</Badge>
                        <Badge tone={payoutStatusTone(item.status)}>{payoutStatusLabel(item.status, t)}</Badge>
                      </div>
                      <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
                        {payoutChannelLabel(item.channel, t)}
                      </p>
                    </div>
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      {formatDateTime(item.createdAt, locale)}
                    </span>
                  </div>
                  <div className="mt-md grid gap-sm border-y border-outline-variant py-sm sm:grid-cols-2">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant">
                        {t("الهوية المسجلة", "Registered identity")}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{payoutRoleLabel(item.role ?? item.recipientRole, t)}</Badge>
                        <span className="font-label-lg text-label-lg text-on-surface">
                          {item.recipientName?.trim() || t("غير متاح", "Not available")}
                        </span>
                      </div>
                      <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
                        {item.recipientPhone?.trim() || t("رقم الهاتف غير متاح", "Phone not available")}
                      </p>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant">
                        {t("وجهة التحويل الحالية", "Current payout destination")}
                      </p>
                      <p className="mt-1 font-label-lg text-label-lg text-on-surface">
                        {destinationLabel(item, t)}
                      </p>
                      <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
                        {t("بيانات الوجهة التي أدخلها المستلم", "Destination details supplied by recipient")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-md grid grid-cols-3 gap-2">
                    <div className="rounded-card bg-surface-container-low p-sm">
                      <p className="font-label-md text-label-md text-on-surface-variant">{t("الإجمالي", "Gross")}</p>
                      <p className="font-label-lg text-label-lg text-on-surface">{formatCurrency(payoutGross(item), locale)}</p>
                    </div>
                    <div className="rounded-card bg-surface-container-low p-sm">
                      <p className="font-label-md text-label-md text-on-surface-variant">{t("الرسم المثبت", "Snapshotted fee")}</p>
                      <p className="font-label-lg text-label-lg text-on-surface">{formatCurrency(payoutFee(item), locale)}</p>
                    </div>
                    <div className="rounded-card bg-surface-container-low p-sm">
                      <p className="font-label-md text-label-md text-on-surface-variant">{t("الصافي", "Net")}</p>
                      <p className="font-label-lg text-label-lg text-success">{formatCurrency(payoutNet(item), locale)}</p>
                    </div>
                  </div>
                  <p className="mt-sm font-label-md text-label-md text-on-surface-variant">
                    {item.feePayer === "platform"
                      ? t("الرسم على المنصة", "Platform-paid fee")
                      : t("الرسم على المستلم", "Recipient-paid fee")}
                    {item.transferReference ? ` · ${t("مرجع", "Ref")}: ${item.transferReference}` : ""}
                  </p>
                  {item.status === "approved" ? (
                    <div className="mt-md rounded-card border border-outline-variant bg-surface-container-low p-md">
                      <div className="flex flex-wrap items-center justify-between gap-sm">
                        <div>
                          <p className="font-label-lg text-label-lg text-on-surface">
                            {t("إثبات التحويل", "Transfer proof")}
                          </p>
                          <p className="font-label-md text-label-md text-on-surface-variant">
                            {item.channel === "cash_branch"
                              ? t("ارفع صورة إيصال نقدي موقّع.", "Upload a signed cash receipt.")
                              : t("ارفع صورة التحويل قبل تسجيل الدفع.", "Upload transfer proof before recording payment.")}
                          </p>
                        </div>
                        {proofPath ? (
                          <Button variant="ghost" onClick={() => void viewProof(item)}>
                            {t("عرض الإثبات", "View proof")}
                          </Button>
                        ) : null}
                      </div>
                      {item.channel === "cash_branch" ? (
                        <label className="mt-sm flex items-center gap-2 font-label-md text-label-md text-on-surface">
                          <input
                            type="checkbox"
                            checked={signedReceipt[String(item.id)] ?? item.proof?.isSignedReceipt ?? false}
                            onChange={(event) => setSignedReceipt((previous) => ({ ...previous, [String(item.id)]: event.target.checked }))}
                          />
                          {t("أؤكد أن الصورة إيصال نقدي موقّع.", "I confirm this image is a signed cash receipt.")}
                        </label>
                      ) : null}
                      <label className="mt-sm inline-flex cursor-pointer items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2 font-label-md text-label-md text-on-surface">
                        <span>{uploadingId === item.id ? t("جارٍ الرفع…", "Uploading…") : t("إرفاق صورة", "Attach image")}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingId !== null}
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) void attachProof(item, file);
                          }}
                        />
                      </label>
                      <p className="mt-1 font-label-md text-label-md text-outline">
                        {t(`JPG أو PNG أو WebP، حتى ${REFUND_PROOF_MAX_BYTES / 1_000_000} ميجابايت.`, `JPG, PNG, or WebP, up to ${REFUND_PROOF_MAX_BYTES / 1_000_000} MB.`)}
                      </p>
                    </div>
                  ) : null}
                  {proofErrors[String(item.id)] ? <p className="mt-sm text-label-md text-error">{proofErrors[String(item.id)]}</p> : null}
                  {proofUrls[String(item.id)] ? (
                    <img
                      src={proofUrls[String(item.id)]}
                      alt={t("إثبات الدفع", "Payment proof")}
                      className="mt-md max-h-72 w-full rounded-card border border-outline-variant object-contain"
                    />
                  ) : null}
                  <div className="mt-md flex flex-wrap gap-2">
                    {item.status === "pending" ? (
                      <Button onClick={() => beginAction(item, "approve")}>{t("اعتماد", "Approve")}</Button>
                    ) : null}
                    {item.status === "pending" || item.status === "approved" ? (
                      <Button variant="danger" onClick={() => beginAction(item, "reject")}>{t("رفض", "Reject")}</Button>
                    ) : null}
                    {item.status === "approved" && proofPath ? (
                      <Button onClick={() => beginAction(item, "paid")}>{t("تسجيل الدفع", "Mark paid")}</Button>
                    ) : null}
                  </div>
                  {activeAction ? (
                    <div className="mt-md rounded-card border-2 border-primary-container bg-primary-container/15 p-md">
                      <p className="font-label-lg text-label-lg text-on-surface">
                        {activeAction.kind === "approve"
                          ? t("سبب الاعتماد", "Approval reason")
                          : activeAction.kind === "reject"
                            ? t("سبب الرفض", "Rejection reason")
                            : t("ملاحظة تسجيل الدفع", "Payment note")}
                      </p>
                      <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        rows={2}
                        placeholder={t("السبب مطلوب لسجل التدقيق", "A reason is required for the audit trail")}
                        className="mt-sm w-full rounded-button border border-outline-variant bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface outline-none focus:border-secondary"
                      />
                      {activeAction.kind === "paid" && item.channel !== "cash_branch" ? (
                        <Field
                          label={t("مرجع التحويل", "Transfer reference")}
                          value={transferReference}
                          onChange={(event) => setTransferReference(event.target.value)}
                          hint={t("مطلوب للتحويلات الإلكترونية.", "Required for electronic channels.")}
                        />
                      ) : null}
                      <div className="mt-sm flex flex-wrap gap-2">
                        <Button disabled={!reason.trim() || submittingId === item.id} onClick={() => void submitAction(item)}>
                          {submittingId === item.id ? t("جارٍ الحفظ…", "Saving…") : t("تأكيد", "Confirm")}
                        </Button>
                        <Button variant="ghost" disabled={submittingId === item.id} onClick={() => setAction(null)}>
                          {t("إلغاء", "Cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title={t("إعدادات رسوم التحويل", "Payout fee settings")} icon="tune" />
        <Card className="p-md">
          <p className="mb-md font-body-md text-body-md text-on-surface-variant">
            {t(
              "تؤثر التغييرات على الطلبات الجديدة فقط. كل طلب يحتفظ بلقطة الرسم والدافع وقت إنشائه.",
              "Changes apply to new requests only. Every request keeps its fee and payer snapshot from creation.",
            )}
          </p>
          {settingsLoading ? <p className="text-body-md text-on-surface-variant">{t("جارٍ التحميل…", "Loading…")}</p> : (
            <>
              <div className="grid gap-md sm:grid-cols-3">
                {PAYOUT_CHANNELS.map((channel) => (
                  <label key={channel} className="flex flex-col gap-1.5">
                    <span className="font-label-md text-label-md text-on-surface-variant">{payoutChannelLabel(channel, t)}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.channels[channel].fee}
                      onChange={(event) => {
                        const fee = Number(event.target.value);
                        setSettings((previous) => ({
                          ...previous,
                          channels: { ...previous.channels, [channel]: { fee: Number.isFinite(fee) ? fee : 0 } },
                        }));
                        setSettingsSaved(false);
                      }}
                      className={settingInputClass()}
                    />
                  </label>
                ))}
              </div>
              <label className="mt-md flex max-w-sm flex-col gap-1.5">
                <span className="font-label-md text-label-md text-on-surface-variant">{t("دافع الرسم الافتراضي", "Default fee payer")}</span>
                <select
                  value={settings.defaultFeePayer}
                  onChange={(event) => {
                    setSettings((previous) => ({ ...previous, defaultFeePayer: event.target.value as AdminPayoutSettings["defaultFeePayer"] }));
                    setSettingsSaved(false);
                  }}
                  className={settingInputClass()}
                >
                  <option value="recipient">{t("المستلم", "Recipient")}</option>
                  <option value="platform">{t("المنصة", "Platform")}</option>
                </select>
              </label>
              <div className="mt-md max-w-xl">
                <Field
                  label={t("سبب التعديل", "Change reason")}
                  value={settingsReason}
                  onChange={(event) => {
                    setSettingsReason(event.target.value);
                    setSettingsSaved(false);
                  }}
                  hint={t("مطلوب لإضافة سجل التدقيق.", "Required for the audit log.")}
                />
              </div>
              {settingsError ? <p className="mt-md text-body-md text-error">{settingsError}</p> : null}
              {settingsSaved ? <p className="mt-md text-body-md text-success">{t("تم حفظ الإعدادات.", "Settings saved.")}</p> : null}
              <Button className="mt-md" disabled={settingsSaving || !settingsReason.trim()} onClick={() => void saveSettings()}>
                {settingsSaving ? t("جارٍ الحفظ…", "Saving…") : t("حفظ إعدادات الرسوم", "Save fee settings")}
              </Button>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}