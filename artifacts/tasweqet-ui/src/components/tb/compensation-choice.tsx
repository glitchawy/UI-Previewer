import { useMemo, useRef, useState } from "react";
import type {
  AdminRefundApprovalInput,
  AdminRefundOrderItem,
  CompensationType as ApiCompensationType,
  ResponsibleParty as ApiResponsibleParty,
} from "@workspace/api-client-react";
import { Button, Card, Icon } from "@/components/tb/shell";
import { adminCurrency } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

export type CompensationType = ApiCompensationType;
export type ResponsibleParty = ApiResponsibleParty;
export type CompensationOrderItem = AdminRefundOrderItem;
export type CompensationDecisionInput = AdminRefundApprovalInput;

type Choice = {
  value: CompensationType;
  icon: string;
  ar: string;
  en: string;
  detailAr: string;
  detailEn: string;
};

const choices: Choice[] = [
  {
    value: "full_refund",
    icon: "currency_exchange",
    ar: "استرداد كامل",
    en: "Full refund",
    detailAr: "إضافة إجمالي الطلب إلى محفظة العميل",
    detailEn: "Credit the full order total to the customer's wallet",
  },
  {
    value: "item_refund",
    icon: "restaurant",
    ar: "استرداد أصناف",
    en: "Item refund",
    detailAr: "اختار الأصناف والكميات التي سيُعاد مبلغها",
    detailEn: "Select the items and quantities to refund",
  },
  {
    value: "courtesy_credit",
    icon: "volunteer_activism",
    ar: "رصيد مجاملة",
    en: "Courtesy credit",
    detailAr: "أضف مبلغاً إيجابياً لا يتجاوز إجمالي الطلب",
    detailEn: "Add a positive amount up to the order total",
  },
];

const parties: Array<{ value: ResponsibleParty; ar: string; en: string }> = [
  { value: "restaurant", ar: "المطعم", en: "Restaurant" },
  { value: "driver", ar: "المندوب", en: "Driver" },
  { value: "customer", ar: "العميل", en: "Customer" },
  { value: "platform", ar: "المنصة", en: "Platform" },
  { value: "shared", ar: "مشترك", en: "Shared" },
  { value: "undetermined", ar: "غير محدد", en: "Undetermined" },
];

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function itemAmount(item: CompensationOrderItem, quantity: number): number {
  if (!item.quantity || !Number.isFinite(item.lineTotal)) return 0;
  return roundCurrency((item.lineTotal / item.quantity) * quantity);
}

export function compensationTypeLabel(type: string | null | undefined, t: ReturnType<typeof useTranslation>["t"]): string {
  const choice = choices.find((item) => item.value === type);
  return choice ? t(choice.ar, choice.en) : t("قرار قديم", "Legacy decision");
}

export function responsiblePartyLabel(party: string | null | undefined, t: ReturnType<typeof useTranslation>["t"]): string {
  const match = parties.find((item) => item.value === party);
  return match ? t(match.ar, match.en) : party || t("غير متاح", "Not available");
}

type CompensationChoiceProps = {
  orderTotal: number;
  orderItems: CompensationOrderItem[];
  onSubmit: (input: CompensationDecisionInput) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
};

/**
 * A deliberately explicit decision form. The responsible party is never
 * inferred from the selected compensation type; the API receives both values.
 */
export function CompensationChoice({
  orderTotal,
  orderItems,
  onSubmit,
  isSubmitting = false,
  submitError = null,
}: CompensationChoiceProps) {
  const { t, locale } = useTranslation();
  const [type, setType] = useState<CompensationType | null>(null);
  const [party, setParty] = useState<ResponsibleParty | "">("");
  const [note, setNote] = useState("");
  const [courtesyAmount, setCourtesyAmount] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const submitGuard = useRef(false);

  const selectedItems = useMemo(
    () =>
      orderItems
        .map((item) => ({ item, quantity: quantities[item.id] ?? 0 }))
        .filter(({ quantity }) => quantity > 0),
    [orderItems, quantities],
  );
  const previewAmount = useMemo(() => {
    if (type === "full_refund") return orderTotal;
    if (type === "courtesy_credit") return Number(courtesyAmount);
    if (type === "item_refund") {
      return roundCurrency(selectedItems.reduce((sum, entry) => sum + itemAmount(entry.item, entry.quantity), 0));
    }
    return 0;
  }, [courtesyAmount, orderTotal, selectedItems, type]);
  const amountIsValid =
    Number.isFinite(previewAmount) &&
    previewAmount > 0 &&
    previewAmount <= orderTotal &&
    (type !== "courtesy_credit" || /^\d+(\.\d{1,2})?$/.test(courtesyAmount.trim()));

  const setItemQuantity = (item: CompensationOrderItem, value: string) => {
    const next = Math.max(0, Math.min(item.quantity, Math.floor(Number(value) || 0)));
    setQuantities((current) => ({ ...current, [item.id]: next }));
    setValidationError(null);
  };

  const reviewDecision = () => {
    if (!type) {
      setValidationError(t("اختار نوع التعويض أولاً.", "Choose a compensation type first."));
      return;
    }
    if (!party) {
      setValidationError(t("حدد الجهة المسؤولة عن الحالة.", "Select the responsible party."));
      return;
    }
    if (!note.trim()) {
      setValidationError(t("شرح القرار مطلوب.", "An explanation is required."));
      return;
    }
    if (note.trim().length > 1000) {
      setValidationError(t("الشرح يجب ألا يتجاوز 1000 حرف.", "The explanation must be 1000 characters or fewer."));
      return;
    }
    if (type === "item_refund" && selectedItems.length === 0) {
      setValidationError(t("اختار صنفاً واحداً على الأقل وحدد كميته.", "Select at least one item and quantity."));
      return;
    }
    if (type === "courtesy_credit" && (!amountIsValid || previewAmount > orderTotal)) {
      setValidationError(t("اكتب مبلغاً موجباً لا يتجاوز إجمالي الطلب.", "Enter a positive amount no greater than the order total."));
      return;
    }
    if (!amountIsValid) {
      setValidationError(t("لا يمكن أن يكون مبلغ التعويض صفراً.", "Compensation must be greater than zero."));
      return;
    }
    setValidationError(null);
    setShowConfirmation(true);
  };

  const submitDecision = async () => {
    if (submitGuard.current || isSubmitting || !type || !party || !amountIsValid) return;
    submitGuard.current = true;
    try {
      await onSubmit({
        note: note.trim(),
        compensationType: type,
        responsibleParty: party,
        ...(type === "item_refund"
          ? { items: selectedItems.map(({ item, quantity }) => ({ orderItemId: item.id, quantity })) }
          : {}),
        ...(type === "courtesy_credit" ? { courtesyAmount: courtesyAmount.trim() } : {}),
      });
    } catch {
      // The parent renders the server error. Allow a deliberate retry after it.
      submitGuard.current = false;
    }
  };

  return (
    <Card className="space-y-4 border-secondary/40 p-md" data-testid="compensation-choice">
      <div>
        <h3 className="font-headline-md text-headline-md">{t("قرار التعويض", "Compensation decision")}</h3>
        <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
          {t("اختار النوع والجهة بشكل صريح؛ لا يتم خصم تلقائي من أي شريك.", "Choose the type and party explicitly; no partner deduction is automatic.")}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 font-label-lg text-label-lg">{t("نوع التعويض", "Compensation type")} <span className="text-error">*</span></legend>
        <div className="grid gap-2 md:grid-cols-3">
          {choices.map((choice) => (
            <label
              key={choice.value}
              className={`flex cursor-pointer gap-2 rounded-card border p-3 transition ${
                type === choice.value ? "border-secondary bg-secondary-container/50" : "border-outline-variant bg-surface-container-lowest"
              }`}
            >
              <input
                type="radio"
                name="compensation-type"
                value={choice.value}
                checked={type === choice.value}
                onChange={() => {
                  setType(choice.value);
                  setValidationError(null);
                }}
                className="mt-1 accent-secondary"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-label-lg text-label-lg"><Icon name={choice.icon} className="text-[18px]" />{t(choice.ar, choice.en)}</span>
                <span className="mt-1 block font-label-md text-label-md text-on-surface-variant">{t(choice.detailAr, choice.detailEn)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === "full_refund" ? (
        <div className="flex items-center justify-between rounded-button bg-secondary-container/50 p-3">
          <span className="font-label-lg text-label-lg">{t("إجمالي الطلب", "Order total")}</span>
          <strong>{adminCurrency(orderTotal, locale)}</strong>
        </div>
      ) : null}

      {type === "item_refund" ? (
        <fieldset className="space-y-2">
          <legend className="mb-1 font-label-lg text-label-lg">{t("الأصناف والكميات", "Items and quantities")} <span className="text-error">*</span></legend>
          {orderItems.length ? orderItems.map((item) => {
            const quantity = quantities[item.id] ?? 0;
            return (
              <div key={item.id} className={`flex items-center gap-2 rounded-button border p-3 ${quantity ? "border-secondary bg-secondary-container/30" : "border-outline-variant"}`}>
                <input type="checkbox" checked={quantity > 0} onChange={(event) => setItemQuantity(item, event.target.checked ? "1" : "0")} className="size-4 accent-secondary" aria-label={t(`اختيار ${item.productName}`, `Select ${item.productName}`)} />
                <div className="min-w-0 flex-1">
                  <p className="font-label-lg text-label-lg">{item.productName}{item.variantName ? ` · ${item.variantName}` : ""}</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">{item.quantity} × {adminCurrency(item.lineTotal / item.quantity, locale)}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={item.quantity}
                  step={1}
                  value={quantity}
                  onChange={(event) => setItemQuantity(item, event.target.value)}
                  aria-label={t("الكمية المستردة", "Refund quantity")}
                  className="w-20 rounded-button border border-outline-variant bg-surface-container-lowest px-2 py-2 text-center outline-none focus:border-secondary"
                />
                <span className="w-20 text-end font-label-lg text-label-lg">{adminCurrency(itemAmount(item, quantity), locale)}</span>
              </div>
            );
          }) : <p className="rounded-button bg-surface-container p-3 text-label-md text-on-surface-variant">{t("لا توجد أصناف متاحة لهذا الطلب القديم.", "No item details are available for this legacy order.")}</p>}
        </fieldset>
      ) : null}

      {type === "courtesy_credit" ? (
        <label className="block">
          <span className="mb-1 block font-label-lg text-label-lg">{t("مبلغ رصيد المجاملة (جنيه مصري)", "Courtesy credit amount (EGP)")} <span className="text-error">*</span></span>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            max={orderTotal}
            step="0.01"
            value={courtesyAmount}
            onChange={(event) => {
              setCourtesyAmount(event.target.value);
              setValidationError(null);
            }}
            placeholder="0.00"
            className="w-full rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 outline-none focus:border-secondary"
          />
          <span className="mt-1 block font-label-md text-label-md text-on-surface-variant">{t(`الحد الأقصى: ${adminCurrency(orderTotal, locale)}`, `Maximum: ${adminCurrency(orderTotal, locale)}`)}</span>
        </label>
      ) : null}

      <label className="block">
        <span className="mb-1 block font-label-lg text-label-lg">{t("الجهة المسؤولة", "Responsible party")} <span className="text-error">*</span></span>
        <select
          value={party}
          onChange={(event) => {
            setParty(event.target.value as ResponsibleParty | "");
            setValidationError(null);
          }}
          className="w-full rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 outline-none focus:border-secondary"
        >
          <option value="">{t("اختار الجهة", "Select a party")}</option>
          {parties.map((entry) => <option key={entry.value} value={entry.value}>{t(entry.ar, entry.en)}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block font-label-lg text-label-lg">{t("شرح القرار", "Decision explanation")} <span className="text-error">*</span></span>
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setValidationError(null);
          }}
          maxLength={1000}
          rows={3}
          required
          placeholder={t("اشرح سبب ونطاق القرار", "Explain the reason and scope of this decision")}
          className="w-full rounded-card border border-outline-variant bg-surface-container-lowest p-3 outline-none focus:border-secondary"
        />
        <span className="mt-1 block text-end font-label-md text-label-md text-on-surface-variant">{note.length}/1000</span>
      </label>

      <div className="flex items-center justify-between rounded-button bg-surface-container p-3" aria-live="polite">
        <span className="font-label-lg text-label-lg">{t("المبلغ المتوقع إضافته للمحفظة", "Expected wallet credit")}</span>
        <strong>{Number.isFinite(previewAmount) && previewAmount > 0 ? adminCurrency(previewAmount, locale) : "—"}</strong>
      </div>

      <p className="flex items-start gap-2 rounded-button bg-warning/10 p-3 font-label-md text-label-md text-on-surface-variant">
        <Icon name="info" className="mt-0.5 shrink-0 text-[18px]" />
        {t("نسبة المسؤولية لا تنفذ خصماً تلقائياً من المطعم أو المندوب؛ هي توثيق للقرار فقط.", "Attribution does not automatically deduct from the restaurant or driver; it records the decision only.")}
      </p>

      {validationError ? <p className="rounded-button bg-error-container p-3 font-label-md text-label-md text-error" role="alert">{validationError}</p> : null}
      {submitError ? <p className="rounded-button bg-error-container p-3 font-label-md text-label-md text-error" role="alert">{submitError}</p> : null}

      {showConfirmation ? (
        <div className="space-y-3 rounded-card border-2 border-secondary bg-secondary-container/30 p-3" role="alertdialog" aria-label={t("تأكيد قرار التعويض", "Confirm compensation decision")}>
          <div className="flex items-center gap-2"><Icon name="fact_check" className="text-secondary" /><p className="font-label-lg text-label-lg">{t("راجع القرار قبل الاعتماد", "Review before approving")}</p></div>
          <div className="grid grid-cols-2 gap-2 font-label-md text-label-md">
            <span className="text-on-surface-variant">{t("النوع", "Type")}</span><strong>{compensationTypeLabel(type, t)}</strong>
            <span className="text-on-surface-variant">{t("الجهة", "Party")}</span><strong>{responsiblePartyLabel(party, t)}</strong>
            <span className="text-on-surface-variant">{t("المبلغ", "Amount")}</span><strong>{adminCurrency(previewAmount, locale)}</strong>
          </div>
          <p className="whitespace-pre-wrap break-words rounded-button bg-surface-container-lowest p-2 font-label-md text-label-md">{note.trim()}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={() => setShowConfirmation(false)}>{t("تعديل", "Edit")}</Button>
            <Button type="button" disabled={isSubmitting || submitGuard.current} onClick={() => void submitDecision()}>{isSubmitting ? t("جاري الاعتماد…", "Approving…") : t("تأكيد واعتماد", "Confirm and approve")}</Button>
          </div>
        </div>
      ) : (
        <Button type="button" icon="preview" disabled={isSubmitting} onClick={reviewDecision}>{t("مراجعة القرار", "Review decision")}</Button>
      )}
    </Card>
  );
}