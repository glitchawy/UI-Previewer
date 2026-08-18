import { createFileRoute } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Button } from "@/components/tb/shell";
import { customerWallet, EGP } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | المحفظة" },
      { name: "description", content: "رصيدك وحركات الشحن والدفع في محفظتك" },
      { property: "og:title", content: "طلبات بيتك | المحفظة" },
      { property: "og:description", content: "رصيدك وحركات الشحن والدفع في محفظتك" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppWallet,
});

function AppWallet() {
  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="المحفظة" back="/app/profile" />
      <div className="flex flex-col gap-lg p-md">
        <Card className="flex flex-col items-center gap-2 bg-primary-container p-lg text-center text-on-primary-container">
          <Icon name="account_balance_wallet" className="text-[32px]" />
          <p className="font-label-md text-label-md opacity-80">رصيدك الحالي</p>
          <p className="font-headline-lg text-headline-lg">{EGP(customerWallet.balance)}</p>
          <Button variant="outline" icon="add_card" className="mt-2 border-on-primary-container text-on-primary-container">
            شحن المحفظة
          </Button>
        </Card>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">حركات المحفظة</h2>
          <div className="tb-stagger flex flex-col gap-2">
            {customerWallet.transactions.map((t) => (
              <Card key={t["id"]} className="flex items-center gap-3 p-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-full ${
                    t["type"] === "credit" ? "bg-success/15 text-success" : "bg-error-container text-on-error-container"
                  }`}
                >
                  <Icon name={t["type"] === "credit" ? "call_received" : "call_made"} className="text-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-label-lg text-label-lg text-on-surface">{t["title"]}</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">{t["ref"]} · {t["at"]}</p>
                </div>
                <span className={`font-label-lg text-label-lg ${t["type"] === "credit" ? "text-success" : "text-error"}`}>
                  {t["type"] === "credit" ? "+" : "-"}{EGP(t["amount"])}
                </span>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
