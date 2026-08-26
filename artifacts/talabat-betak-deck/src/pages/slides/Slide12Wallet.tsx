export default function Slide12Wallet() {
  return (
    <div className="grid-paper relative w-screen h-screen overflow-hidden">
      <div className="accent-square" /><div className="slide-header"><div className="header-brand">Talabat Betak</div><div className="header-date">Wallet accounting</div></div>
      <div className="slide-content"><div className="eyebrow">12 / Wallet</div><h2 className="slide-title">Wallet payments are ledger-backed</h2>
        <div className="two-column" style={{marginTop: '5vh'}}><div className="panel"><h3>Checkout behavior</h3><ul className="bullet-list body-copy"><li><span className="bullet-mark" />Customers can pay partially or fully from wallet balance</li><li><span className="bullet-mark" />Balances use integer-cent calculations</li><li><span className="bullet-mark" />Debits are conditional and cannot make a wallet negative</li></ul></div><div className="panel"><h3>Accounting guarantees</h3><ul className="bullet-list body-copy"><li><span className="bullet-mark" />Every debit and credit is an append-only transaction</li><li><span className="bullet-mark" />Order payment allocation is immutable after insertion</li></ul></div></div>
      </div><div className="slide-number">12</div>
    </div>
  );
}