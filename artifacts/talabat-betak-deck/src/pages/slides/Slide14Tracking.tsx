export default function Slide14Tracking() {
  return (
    <div className="grid-paper relative w-screen h-screen overflow-hidden">
      <div className="accent-square" /><div className="slide-header"><div className="header-brand">Talabat Betak</div><div className="header-date">Location lifecycle</div></div>
      <div className="slide-content"><div className="eyebrow">14 / Tracking and privacy</div><h2 className="slide-title">Tracking respects lifecycle and privacy</h2>
        <div className="card-grid-3"><div className="card"><div className="card-mark" /><h3>Collect</h3><p>Drivers share GPS only for assigned active work</p></div><div className="card"><div className="card-mark" /><h3>Expose</h3><p>Precise coordinates are exposed to the owning customer only after pickup</p></div><div className="card"><div className="card-mark" /><h3>Scope</h3><p>Orders expose tracking data according to role and order ownership</p></div></div>
        <div className="two-column" style={{marginTop: '3vh'}}><div className="panel"><h3>Auditability</h3><p className="body-copy">Driver location updates are stored with timestamps</p></div><div className="panel"><h3>Hardening area</h3><p className="body-copy">Lock-screen continuity remains a follow-up hardening area</p></div></div>
      </div><div className="slide-number">14</div>
    </div>
  );
}