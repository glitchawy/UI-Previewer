import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useGetCustomerWallet } from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Button, EmptyState } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { EGP, formatOrderDate } from "@/lib/tb/orders";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | المحفظة" },
      { name: "description", content: "رصيدك وحركات الدفع والاسترداد في محفظتك" },
    ],
  }),
  component: AppWallet,
});

const PAGE_SIZE = 10;

function AppWallet() {
  const [page, setPage] = useState(1);
  const wallet = useGetCustomerWallet({ page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil((wallet.data?.total ?? 0) / PAGE_SIZE));

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="المحفظة" back="/app/profile" />
      <div className="flex flex-col gap-lg p-md">
        <Card className="flex flex-col items-center gap-2 bg-primary-container p-lg text-center text-on-primary-container">
          <Icon name="account_balance_wallet" className="text-[32px]" />
          <p className="font-label-md text-label-md opacity-80">رصيدك الحالي</p>
          <p className="font-headline-lg text-headline-lg">{wallet.isLoading ? "—" : EGP(wallet.data?.balance ?? 0)}</p>
          <p className="font-label-md text-label-md opacity-80">تقدر تستخدم الرصيد في طلبك الجاي</p>
        </Card>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">حركات المحفظة</h2>
          {wallet.isLoading ? (
            <div className="flex h-44 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[34px] text-primary" /></div>
          ) : wallet.isError ? (
            <EmptyState icon="error" title="تعذر تحميل المحفظة" body="حاول مرة أخرى بعد قليل" />
          ) : wallet.data?.transactions.length === 0 ? (
            <EmptyState icon="receipt_long" title="مفيش حركات لسه" body="عمليات الدفع والاسترداد هتظهر هنا" />
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
                    <p className="font-label-md text-[11px] text-outline">الرصيد بعد العملية: {EGP(transaction.balanceAfter)}</p>
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
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} icon="chevron_right">الأحدث</Button>
            <span className="font-label-md text-label-md text-on-surface-variant">صفحة {page.toLocaleString("ar-EG")} من {totalPages.toLocaleString("ar-EG")}</span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} icon="chevron_left">الأقدم</Button>
          </div>
        ) : null}
      </div>
    </MobileShell>
  );
}