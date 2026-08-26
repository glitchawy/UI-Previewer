export default function Slide10GroupedOrders() {
  return (
    <div className="grid-paper relative w-screen h-screen overflow-hidden">
      <div className="accent-square" /><div className="slide-header"><div className="header-brand">Talabat Betak</div><div className="header-date">Order architecture</div></div>
      <div className="slide-content"><div className="eyebrow">10 / Order architecture</div><h2 className="slide-title">One cart can become grouped orders</h2>
        <div className="data-flow"><div className="data-box primary"><h3>Customer cart</h3><p>A checkout can contain items from multiple restaurants</p></div><div className="data-arrow">→</div><div className="data-box accent"><h3>Child orders</h3><p>The system creates restaurant-specific child orders</p></div><div className="data-arrow">→</div><div className="data-box sky"><h3>Payment session</h3><p>A grouped payment session links the child orders</p></div></div>
        <div className="two-column" style={{marginTop: '3vh'}}><div className="panel"><h3>Immutable allocation</h3><p className="body-copy">Each child order stores its own immutable payment allocation</p></div><div className="panel"><h3>Shared context</h3><p className="body-copy">Customer and admin views preserve the grouped-order relationship</p></div></div>
      </div><div className="slide-number">10</div>
    </div>
  );
}