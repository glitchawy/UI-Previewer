import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useGetCustomerWallet } from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Button, EmptyState } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { EGP, formatOrderDate } from "@/lib/tb/orders";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | المحفظة", "Talabat Betak | Wallet") },
      { name: "description", content: translate("رصيدك وحركات الدفع والاسترداد في محفظتك", "Your wallet balance, payments, and refunds") },
    ],
  }),
  component: AppWallet,
});

const PAGE_SIZE = 10;

function AppWallet() {
  const { t, locale } = useTranslation();
  const [page, setPage] = useState(1);
  const wallet = useGetCustomerWallet({ page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil((wallet.data?.total ?? 0) / PAGE_SIZE));

  return (
    <MobileShell tabs={customerTabs}>
       <AppBar title={t("المحفظة", "Wallet")} back="/app/profile" />
      <div className="flex flex-col gap-lg p-md">
        <Card className="flex flex-col items-center gap-2 bg-primary-container p-lg text-center text-on-primary-container">
          <Icon name="account_balance_wallet" className="text-[32px]" />
           <p className="font-label-md text-label-md opacity-80">{t("رصيدك الحالي", "Current balance")}</p>
           <p className="font-headline-lg text-headline-lg">{wallet.isLoading ? "—" : EGP(wallet.data?.balance ?? 0)}</p>
           <p className="font-label-md text-label-md opacity-80">{t("تقدر تستخدم الرصيد في طلبك الجاي", "You can use this balance on your next order")}</p>
        </Card>

        <section>
           <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">{t("حركات المحفظة", "Wallet activity")}</h2>
          {wallet.isLoading ? (
            <div className="flex h-44 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[34px] text-primary" /></div>
          ) : wallet.isError ? (
             <EmptyState icon="error" title={t("تعذر تحميل المحفظة", "Unable to load wallet")} body={t("حاول مرة أخرى بعد قليل", "Please try again later")} />
          ) : wallet.data?.transactions.length === 0 ? (
             <EmptyState icon="receipt_long" title={t("مفيش حركات لسه", "No activity yet")} body={t("عمليات الدفع والاسترداد هتظهر هنا", "Payments and refunds will appear here")} />
          ) : (
            <div className="tb-stagger flex flex-col gap-2">
              {wallet.data?.transactions.map((transaction) => (
                <Card key={transaction.id} className="flex items-center gap-3 p-3">
                  <span className={`flex size-10 items-center justify-center rounded-full ${
                    transaction.type === "credit" ? "bg-success/15 text-success" : "bg-error-container text-on-error-container"
                  }`}>
                    <Icon name={transaction.type === "credit" ? "call_received" : "call_made"} className="text-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-label-lg text-label-lg text-on-surface">{transaction.description}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{formatOrderDate(transaction.createdAt)}</p>
                     <p className="font-label-md text-[11px] text-outline">{t("الرصيد بعد العملية:", "Balance after transaction:")} {EGP(transaction.balanceAfter)}</p>
                  </div>
                  <span className={`shrink-0 font-label-lg text-label-lg ${transaction.type === "credit" ? "text-success" : "text-error"}`}>
                    {transaction.type === "credit" ? "+" : "−"}{EGP(transaction.amount)}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </section>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between">
             <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} icon="chevron_right">{t("الأحدث", "Newer")}</Button>
             <span className="font-label-md text-label-md text-on-surface-variant">{t("صفحة", "Page")} {page.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} {t("من", "of")} {totalPages.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")}</span>
             <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} icon="chevron_left">{t("الأقدم", "Older")}</Button>
          </div>
        ) : null}
      </div>
    </MobileShell>
  );
}