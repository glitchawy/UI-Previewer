import { useEffect, useRef, useState } from "react";
import { Button, Icon } from "@/components/tb/shell";
import { addCartItem, useCart } from "@/lib/tb/cart";
import { runSingleSubmission } from "@/lib/tb/single-submission";
import { formatCurrency, formatNumber, useTranslation } from "@/lib/i18n";

export type OptionVariant = { id: number; name: string; priceDelta: string; isDefault: boolean };
export type OptionAddon = { id: number; name: string; price: string; isAvailable: boolean };
export type OptionProduct = {
  id: number; restaurantId: number; name: string; description: string | null;
  imageUrl: string | null; basePrice: string; variants: OptionVariant[]; addons: OptionAddon[];
};
const EGP = (value: number | string) => formatCurrency(value);

export function ProductOptionsSheet({ product, onClose, onAdded }: {
  product: OptionProduct | null; onClose: () => void; onAdded?: () => void;
}) {
  const { cart } = useCart();
  const { t, locale } = useTranslation();
  const [variantId, setVariantId] = useState<number | null>(null);
  const [addonIds, setAddonIds] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmMode, setConfirmMode] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const submissionLock = useRef(false);

  useEffect(() => {
    if (!product) { setIsVisible(false); return; }
    setVariantId(product.variants.find((variant) => variant.isDefault)?.id ?? product.variants[0]?.id ?? null);
    setAddonIds([]); setQuantity(1); setError(""); setConfirmMode(false);
    requestAnimationFrame(() => setIsVisible(true));
  }, [product]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!product) return null;
  const currentProduct = product;
  const selectedVariant = product.variants.find((variant) => variant.id === variantId);
  const selectedAddons = product.addons.filter((addon) => addonIds.includes(addon.id));
  const unitTotal = Number(product.basePrice) + Number(selectedVariant?.priceDelta ?? 0) +
    selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0);
  const addingAnotherRestaurant = cart.restaurantIds.length > 0 && !cart.restaurantIds.includes(product.restaurantId);

  async function submit(replaceOtherRestaurants = false) {
    if (currentProduct.variants.length && variantId === null) {
      setError(t("اختار الحجم أولاً", "Choose a size first"));
      return;
    }
    if (addingAnotherRestaurant && !confirmMode) { setConfirmMode(true); return; }
    await runSingleSubmission({
      lock: submissionLock,
      submit: () => addCartItem({
        productId: currentProduct.id,
        variantId,
        addonIds,
        quantity,
        replaceOtherRestaurants,
      }),
      onStart: () => { setPending(true); setError(""); },
      onSuccess: () => {
        // Successful submission must synchronously clear the parent's product
        // state. Animation-only local state left the mounted sheet visible.
        setIsVisible(false);
        onAdded?.();
        onClose();
      },
      onError: (cause) => {
        setError(cause instanceof Error ? cause.message : t("تعذر الإضافة للسلة", "Could not add to cart"));
      },
      onSettled: () => setPending(false),
    });
  }

  const availableAddons = product.addons.filter((addon) => addon.isAvailable);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={handleClose}>
      <div className={`absolute inset-0 bg-[#1b1c17]/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} />
      
      <section 
        className={`relative flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] sm:rounded-[24px] bg-surface shadow-lift transition-transform duration-300 ease-out ${isVisible ? "translate-y-0 scale-100" : "translate-y-full sm:translate-y-0 sm:scale-95"}`} 
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-outline-variant/50 sm:hidden z-10" />
        
        <button type="button" onClick={handleClose} aria-label={t("إغلاق", "Close")} className="absolute top-4 end-4 z-10 flex size-9 items-center justify-center rounded-full bg-surface-container-lowest/80 text-on-surface shadow-sm backdrop-blur transition-transform hover:scale-105 active:scale-95">
          <Icon name="close" className="text-[20px]" />
        </button>

        <div className="overflow-y-auto no-scrollbar pb-24">
          {product.imageUrl ? (
            <div className="relative h-56 w-full shrink-0 bg-surface-container-high">
              <img src={`/api/storage${product.imageUrl}`} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b1c17]/80 via-[#1b1c17]/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow-md">
                <h2 className="font-headline-lg text-[22px] font-bold leading-tight">{product.name}</h2>
              </div>
            </div>
          ) : (
            <div className="px-5 pt-10 pb-4">
              <h2 className="font-headline-lg text-[22px] font-bold text-on-surface">{product.name}</h2>
            </div>
          )}

          <div className="flex flex-col gap-6 p-5">
            {product.description && (
              <p className="font-body-lg text-[15px] text-on-surface-variant leading-relaxed">
                {product.description}
              </p>
            )}

            {product.variants.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-headline-md text-[17px] text-on-surface">
                    <Icon name="straighten" className="text-[20px] text-on-surface-variant" />
                    {t("اختار الحجم", "Choose a size")}
                  </p>
                  <span className="text-[12px] font-medium text-error bg-error-container px-2 py-0.5 rounded-sm">{t("إجباري", "Required")}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {product.variants.map((variant) => (
                    <label key={variant.id} className="group relative flex cursor-pointer items-center justify-between rounded-card border-2 p-3.5 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary-container/10 has-[:not(:checked)]:border-outline-variant/40 has-[:not(:checked)]:bg-surface-container-lowest hover:bg-surface-container-low">
                      <input type="radio" className="peer sr-only" checked={variantId === variant.id} onChange={() => setVariantId(variant.id)} />
                      <div className="flex items-center gap-3">
                        <div className="flex size-5 items-center justify-center rounded-full border-2 border-outline-variant peer-checked:border-primary peer-checked:bg-primary text-on-primary transition-all">
                          <Icon name="circle" className="text-[8px] opacity-0 peer-checked:opacity-100 transition-opacity" filled />
                        </div>
                        <span className="font-label-lg text-[15px] text-on-surface group-hover:text-primary transition-colors">{variant.name}</span>
                      </div>
                      <span className="font-label-md text-[14px] text-on-surface-variant font-medium">
                        {Number(variant.priceDelta) ? `+${EGP(variant.priceDelta)}` : t("بدون زيادة", "No extra charge")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {availableAddons.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-headline-md text-[17px] text-on-surface">
                    <Icon name="add_circle" className="text-[20px] text-on-surface-variant" />
                    {t("إضافات اختيارية", "Optional add-ons")}
                  </p>
                  <span className="text-[12px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-sm">{t("اختياري", "Optional")}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {availableAddons.map((addon) => (
                    <label key={addon.id} className="group relative flex cursor-pointer items-center justify-between rounded-card border-2 p-3.5 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary-container/10 has-[:not(:checked)]:border-outline-variant/40 has-[:not(:checked)]:bg-surface-container-lowest hover:bg-surface-container-low">
                      <input type="checkbox" className="peer size-5 shrink-0 cursor-pointer accent-primary" checked={addonIds.includes(addon.id)}
                        aria-label={addon.name}
                        onChange={(e) => setAddonIds((current) => e.target.checked ? [...current, addon.id] : current.filter((id) => id !== addon.id))} />
                      <div className="flex items-center gap-3">
                        <span className="font-label-lg text-[15px] text-on-surface group-hover:text-primary transition-colors">{addon.name}</span>
                      </div>
                      <span className="font-label-md text-[14px] text-on-surface-variant font-medium">
                        +{EGP(addon.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-card bg-error-container p-3 text-on-error-container">
                <Icon name="error" className="text-[20px] shrink-0" />
                <p className="font-label-md text-[14px]">{error}</p>
              </div>
            )}

            {confirmMode && (
              <div className="rounded-card border-2 border-secondary bg-secondary-container/30 p-4 shadow-sm animate-[tb-fade-up_0.3s_ease-out]">
                <div className="flex items-center gap-2 mb-2 text-on-secondary-container">
                  <Icon name="warning" className="text-[24px] text-secondary" />
                  <h3 className="font-headline-md text-[17px] font-bold">{t("إضافة مطعم جديد للسلة؟", "Add another restaurant to cart?")}</h3>
                </div>
                <p className="font-body-md text-[14px] text-on-secondary-container mb-4 leading-relaxed">
                  {t(
                    "السلة فيها طلبات من مطعم تاني. تحب تدمج الطلبين في سلة واحدة، ولا نبدأ سلة جديدة للمطعم ده ونمسح القديم؟",
                    "Your cart has items from another restaurant. Merge the orders or start a new cart for this restaurant?",
                  )}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button variant="outline" onClick={() => submit(true)} disabled={pending} className="bg-surface-container-lowest">
                    {t("ابدأ سلة جديدة", "Start a new cart")}
                  </Button>
                  <Button onClick={() => submit(false)} disabled={pending} className="bg-secondary text-white hover:brightness-110">
                    {t("ادمج الطلبات", "Merge orders")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-outline-variant/40 bg-surface-container-lowest/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-[12px] bg-surface-container-low p-1 border border-outline-variant/30">
              <button type="button" onClick={() => setQuantity((v) => Math.max(1, v - 1))} className="flex size-[44px] items-center justify-center rounded-[10px] bg-surface-container-lowest shadow-sm text-on-surface hover:bg-surface transition-all active:scale-95 disabled:opacity-50">
                <Icon name="remove" className="text-[20px]" />
              </button>
              <span className="w-6 text-center font-headline-md text-[16px]">{formatNumber(quantity, undefined, locale)}</span>
              <button type="button" onClick={() => setQuantity((v) => Math.min(99, v + 1))} className="flex size-[44px] items-center justify-center rounded-[10px] bg-primary-container text-on-primary-container shadow-sm hover:brightness-105 transition-all active:scale-95">
                <Icon name="add" className="text-[20px]" />
              </button>
            </div>
            {!confirmMode && (
              <Button className="flex-1 h-[52px] shadow-md px-3" onClick={() => submit()} disabled={pending}>
                <span className="flex w-full items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name={pending ? "sync" : "add_shopping_cart"} className={`text-[20px] ${pending ? 'animate-spin' : ''}`} />
                    <span className="font-label-lg text-[16px]">{pending ? t("جاري الإضافة...", "Adding…") : t("أضف للسلة", "Add to cart")}</span>
                  </span>
                  <span className="font-headline-md text-[16px] bg-white/20 px-2 py-0.5 rounded-sm">{EGP(unitTotal * quantity)}</span>
                </span>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
