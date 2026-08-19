import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { getSession, validateWithServer, type AuthUser } from "@/lib/auth-session";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | حسابي" },
      { name: "description", content: "بيانات حسابك وإعدادات طلبات بيتك" },
      { property: "og:title", content: "طلبات بيتك | حسابي" },
      { property: "og:description", content: "بيانات حسابك وإعدادات طلبات بيتك" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppProfile,
});

const links = [
  { to: "/app/wallet", label: "المحفظة", icon: "account_balance_wallet" },
  { to: "/app/favorites", label: "المفضلة", icon: "favorite" },
  { to: "/app/orders", label: "طلباتي", icon: "receipt_long" },
  { to: "/app/notifications", label: "الإشعارات", icon: "notifications" },
  { to: "/app/orders", label: "التقييمات", icon: "star_rate" },
] as const;

function formatPhone(phone: string) {
  return phone.replace(/^(\d{4})(\d{3})(\d{4})$/, "$1 $2 $3");
}

function AppProfile() {
  const [user, setUser] = useState<AuthUser | null>(getSession()?.user ?? null);

  useEffect(() => {
    validateWithServer().then((s) => {
      if (s) setUser(s.user);
    });
  }, []);

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="حسابي" />
      <div className="flex flex-col gap-lg p-md">
        <Card className="flex items-center gap-3 p-md">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="person" className="text-[28px]" />
          </span>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{user?.name ?? "عميل طلبات بيتك"}</p>
            <p className="font-label-md text-label-md text-on-surface-variant" dir="ltr">
              {user ? formatPhone(user.phone) : "—"}
            </p>
          </div>
        </Card>

        {/* Saved delivery address */}
        <Link to="/app/address">
          <Card className="flex items-start gap-3 p-3 transition hover:border-secondary">
            <Icon name="location_on" className="mt-0.5 text-on-surface-variant" />
            <div className="flex-1">
              <p className="font-body-md text-body-md text-on-surface">عنوان التوصيل</p>
              {user?.addressText ? (
                <>
                  <p className="font-label-md text-label-md text-on-surface-variant line-clamp-2">{user.addressText}</p>
                  {user.addressDetails && (
                    <p className="font-label-md text-label-md text-outline line-clamp-1">{user.addressDetails}</p>
                  )}
                </>
              ) : (
                <p className="font-label-md text-label-md text-outline">لم يتم حفظ عنوان بعد — اضغط للإضافة</p>
              )}
            </div>
            <span className="font-label-md text-label-md text-secondary">تعديل</span>
          </Card>
        </Link>

        <div className="flex flex-col gap-2">
          {links.map((l) => (
            <Link key={l.label} to={l.to}>
              <Card className="flex items-center gap-3 p-3 transition hover:border-secondary">
                <Icon name={l.icon} className="text-on-surface-variant" />
                <span className="flex-1 font-body-md text-body-md text-on-surface">{l.label}</span>
                <Icon name="chevron_left" className="text-on-surface-variant" />
              </Card>
            </Link>
          ))}
        </div>

        <Card className="flex items-center justify-between p-3">
          <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
            <Icon name="language" className="text-[18px]" />
            اللغة والعملة
          </span>
          <span className="font-label-md text-label-md text-on-surface">العربية · EGP</span>
        </Card>

        <Link to="/auth/welcome">
          <Card className="flex items-center gap-3 p-3 text-error transition hover:border-error">
            <Icon name="logout" />
            <span className="flex-1 font-body-md text-body-md">تسجيل الخروج</span>
          </Card>
        </Link>

        <p className="text-center font-label-md text-label-md text-outline">طلبات بيتك · الإصدار 1.0.0</p>
      </div>
    </MobileShell>
  );
}
