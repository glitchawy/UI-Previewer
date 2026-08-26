export default function Slide16MoneyGuards() {
  return (
    <div className="grid-paper relative w-screen h-screen overflow-hidden">
      <div className="accent-square" /><div className="slide-header"><div className="header-brand">Talabat Betak</div><div className="header-date">Financial correctness</div></div>
      <div className="slide-content"><div className="eyebrow">16 / Financial correctness</div><h2 className="slide-title">Money movement is guarded twice</h2>
        <div className="guard-grid"><div className="guard"><div className="guard-number">01</div><p>Application services use database transactions and row locks</p></div><div className="guard"><div className="guard-number">02</div><p>Idempotent references prevent duplicate wallet entries and refund approvals</p></div><div className="guard"><div className="guard-number">03</div><p>Paymob callbacks must pass HMAC verification</p></div><div className="guard"><div className="guard-number">04</div><p>Database triggers reject wallet-ledger updates and deletes</p></div><div className="guard"><div className="guard-number">05</div><p>Database triggers reject later edits to order payment allocation</p></div></div>
      </div><div className="slide-number">16</div>
    </div>
  );
}