export default function Slide11Paymob() {
  return (
    <div className="grid-paper relative w-screen h-screen overflow-hidden">
      <div className="accent-square" /><div className="slide-header"><div className="header-brand">Talabat Betak</div><div className="header-date">External payment edge</div></div>
      <div className="slide-content"><div className="eyebrow">11 / Card payments</div><h2 className="slide-title">Paymob handles the external payment edge</h2>
        <div className="flow"><div className="flow-step"><strong>01</strong><p>Card checkout uses a hosted Paymob payment session</p></div><div className="flow-arrow">›</div><div className="flow-step"><strong>02</strong><p>The customer pays only the residual amount after wallet usage</p></div><div className="flow-arrow">›</div><div className="flow-step"><strong>03</strong><p>Webhooks are verified before changing payment state</p></div></div>
        <div className="two-column" style={{marginTop: '3vh'}}><div className="panel"><h3>Settlement</h3><p className="body-copy">Terminal success settles the grouped session</p></div><div className="panel"><h3>Recovery</h3><p className="body-copy">Failed or expired pending sessions restore wallet allocations idempotently</p></div></div>
      </div><div className="slide-number">11</div>
    </div>
  );
}