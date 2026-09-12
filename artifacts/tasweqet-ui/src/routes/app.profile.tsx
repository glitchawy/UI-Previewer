import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Button, Field } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { getSession, logoutSession, saveSession, validateWithServer, type AuthUser } from "@/lib/auth-session";
import { useUpdateProfile } from "@workspace/api-client-react";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | حسابي", "Talabat Betak | My account") },
      { name: "description", content: translate("بيانات حسابك وإعدادات طلبات بيتك", "Your account details and Talabat Betak settings") },
      { property: "og:title", content: translate("طلبات بيتك | حسابي", "Talabat Betak | My account") },
      { property: "og:description", content: translate("بيانات حسابك وإعدادات طلبات بيتك", "Your account details and Talabat Betak settings") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppProfile,
});

const links = [
  { to: "/app/wallet", ar: "المحفظة", en: "Wallet", icon: "account_balance_wallet" },
  { to: "/app/favorites", ar: "المفضلة", en: "Favorites", icon: "favorite" },
  { to: "/app/orders", ar: "طلباتي", en: "My orders", icon: "receipt_long" },
  { to: "/app/notifications", ar: "الإشعارات", en: "Notifications", icon: "notifications" },
  { to: "/app/orders", ar: "التقييمات", en: "Ratings", icon: "star_rate" },
] as const;

function formatPhone(phone: string) {
  return phone.replace(/^(\d{4})(\d{3})(\d{4})$/, "$1 $2 $3");
}

function AppProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(getSession()?.user ?? null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    validateWithServer().then((s) => {
      if (s) {
        setUser(s.user);
        setName(s.user.name ?? "");
      }
    });
  }, []);

  async function saveProfile() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
       setError(t("الاسم يجب أن يتكون من حرفين إلى 80 حرفاً", "Name must be between 2 and 80 characters"));
      return;
    }
    const session = getSession();
    if (!session) {
      navigate({ to: "/auth/login" });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await updateProfile.mutateAsync({ data: { name: trimmed } });
      const nextUser = { ...session.user, name: result.name };
      saveSession({ ...session, user: nextUser });
      setUser(nextUser);
      setName(result.name);
      setEditing(false);
    } catch (cause) {
       setError(cause instanceof Error ? cause.message : t("تعذر حفظ بياناتك", "Unable to save your details"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileShell tabs={customerTabs}>
       <AppBar title={t("حسابي", "My account")} />
      <div className="flex flex-col gap-lg p-md">
        <Card className="flex items-center gap-3 p-md">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="person" className="text-[28px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
             <p className="truncate font-headline-md text-headline-md text-on-surface">{user?.name ?? t("عميل طلبات بيتك", "Talabat Betak customer")}</p>
              {!editing ? (
                <button type="button" onClick={() => setEditing(true)} className="shrink-0 font-label-md text-label-md text-secondary">
                   {t("تعديل", "Edit")}
                </button>
              ) : null}
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant" dir="ltr">
              {user ? formatPhone(user.phone) : "—"}
            </p>
          </div>
        </Card>

        {editing ? (
          <Card className="flex flex-col gap-3 p-md">
             <Field label={t("الاسم", "Name")} value={name} onChange={(event) => setName(event.target.value)} />
            {error ? <p role="alert" className="font-label-md text-label-md text-error">{error}</p> : null}
            <div className="flex gap-2">
               <Button type="button" onClick={saveProfile} disabled={saving}>{saving ? t("جارٍ الحفظ...", "Saving...") : t("حفظ", "Save")}</Button>
              <Button type="button" variant="ghost" onClick={() => { setName(user?.name ?? ""); setError(null); setEditing(false); }} disabled={saving}>
                 {t("إلغاء", "Cancel")}
              </Button>
            </div>
          </Card>
        ) : null}

        {/* Saved delivery address */}
        <Link to="/app/address">
          <Card className="flex items-start gap-3 p-3 transition hover:border-secondary">
            <Icon name="location_on" className="mt-0.5 text-on-surface-variant" />
            <div className="flex-1">
               <p className="font-body-md text-body-md text-on-surface">{t("عنوان التوصيل", "Delivery address")}</p>
              {user?.addressText ? (
                <>
                  <p className="font-label-md text-label-md text-on-surface-variant line-clamp-2">{user.addressText}</p>
                  {user.addressDetails && (
                    <p className="font-label-md text-label-md text-outline line-clamp-1">{user.addressDetails}</p>
                  )}
                </>
              ) : (
                 <p className="font-label-md text-label-md text-outline">{t("لم يتم حفظ عنوان بعد — اضغط للإضافة", "No address saved yet — tap to add one")}</p>
              )}
            </div>
             <span className="font-label-md text-label-md text-secondary">{t("تعديل", "Edit")}</span>
          </Card>
        </Link>

        <div className="flex flex-col gap-2">
          {links.map((l) => (
             <Link key={l.ar} to={l.to}>
              <Card className="flex items-center gap-3 p-3 transition hover:border-secondary">
                <Icon name={l.icon} className="text-on-surface-variant" />
                 <span className="flex-1 font-body-md text-body-md text-on-surface">{t(l.ar, l.en)}</span>
                <Icon name="chevron_left" className="text-on-surface-variant" />
              </Card>
            </Link>
          ))}
        </div>

        <Card className="flex items-center justify-between p-3">
          <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
            <Icon name="language" className="text-[18px]" />
             {t("اللغة والعملة", "Language and currency")}
          </span>
           <span className="font-label-md text-label-md text-on-surface">{t("العربية · EGP", "English · EGP")}</span>
        </Card>

        <button
          type="button"
          onClick={async () => {
            await logoutSession();
            navigate({ to: "/auth/login" });
          }}
          className="text-right"
        >
          <Card className="flex items-center gap-3 p-3 text-error transition hover:border-error">
            <Icon name="logout" />
             <span className="flex-1 font-body-md text-body-md">{t("تسجيل الخروج", "Log out")}</span>
          </Card>
        </button>

         <p className="text-center font-label-md text-label-md text-outline">{t("طلبات بيتك · الإصدار 1.0.0", "Talabat Betak · Version 1.0.0")}</p>
      </div>
    </MobileShell>
  );
}
