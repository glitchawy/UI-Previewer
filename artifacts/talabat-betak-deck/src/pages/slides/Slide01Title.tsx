const base = import.meta.env.BASE_URL;

export default function Slide01Title() {
  return (
    <div className="grid-paper relative w-screen h-screen overflow-hidden">
      <div className="accent-square" />
      <div className="slide-header">
        <div className="header-brand">Talabat Betak</div>
        <div className="header-date">Project overview / 2026</div>
      </div>
      <div className="title-copy">
        <div className="eyebrow">Talabat Betak</div>
        <h1>Talabat Betak</h1>
        <div className="arabic">طلبات بيتك</div>
        <p className="subtitle">An Arabic-first food-delivery platform built for Egypt</p>
        <p className="title-meta">Project overview / 2026</p>
      </div>
      <div className="title-hero">
        <img src={base + "talabat-betak-hero.png"} crossOrigin="anonymous" alt="A local meal ready for delivery" />
      </div>
    </div>
  );
}