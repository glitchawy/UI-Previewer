import { useTranslation, type Locale } from "@/lib/i18n";

/**
 * Small, keyboard-accessible locale control shared by every web shell.
 * The control itself stays LTR so the language names remain easy to scan in
 * either page direction.
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      aria-label="Language / اللغة"
      className="inline-flex items-center gap-0.5 rounded-full border border-outline-variant bg-surface-container p-0.5"
      dir="ltr"
      role="group"
    >
      {(["ar", "en"] as const).map((option: Locale) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          aria-label={option === "ar" ? "العربية" : "English"}
          onClick={() => setLocale(option)}
          className={`rounded-full px-2 py-1 font-label-md text-[11px] transition ${
            locale === option
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          {option === "ar" ? "عربي" : "English"}
        </button>
      ))}
    </div>
  );
}