export default function Slide13CancellationRefunds() {
  return (
    <div className="grid-paper relative w-screen h-screen overflow-hidden">
      <div className="accent-square" /><div className="slide-header"><div className="header-brand">Talabat Betak</div><div className="header-date">Customer money flows</div></div>
      <div className="slide-content"><div className="eyebrow">13 / Cancellation and refunds</div><h2 className="slide-title">Cancellation and refunds have different paths</h2>
        <div className="two-column" style={{marginTop: '5vh'}}><div className="panel"><h3>Cancellation path</h3><ul className="bullet-list body-copy"><li><span className="bullet-mark" />Customer cancellation is allowed only while an order is pending or confirmed</li><li><span className="bullet-mark" />Pending grouped Paymob sessions cancel together and restore wallet usage</li><li><span className="bullet-mark" />Captured card cancellations create a durable Paymob refund claim</li></ul></div><div className="panel"><h3>Refund path</h3><ul className="bullet-list body-copy"><li><span className="bullet-mark" />Delivered orders can enter an Arabic customer refund-request flow</li><li><span className="bullet-mark" />Admin approval credits the wallet once and remains idempotent</li></ul></div></div>
      </div><div className="slide-number">13</div>
    </div>
  );
}