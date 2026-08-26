export default function Slide09Authentication() {
  return (
    <div className="grid-paper relative w-screen h-screen overflow-hidden">
      <div className="accent-square" /><div className="slide-header"><div className="header-brand">Talabat Betak</div><div className="header-date">Identity and access</div></div>
      <div className="slide-content"><div className="eyebrow">09 / Identity</div><h2 className="slide-title">Authentication is a product entry point</h2>
        <div className="flow"><div className="flow-step"><strong>01</strong><p>Phone-based sign-in keeps onboarding familiar for local users</p></div><div className="flow-arrow">›</div><div className="flow-step"><strong>02</strong><p>WhatsApp OTP delivery supports the authentication loop</p></div><div className="flow-arrow">›</div><div className="flow-step"><strong>03</strong><p>Account type determines the user’s starting workflow</p></div></div>
        <div className="two-column" style={{marginTop: '3vh'}}><div className="panel"><h3>Role separation</h3><p className="body-copy">Customer, partner, driver, and admin roles are separated in API contracts</p></div><div className="panel"><h3>Session protection</h3><p className="body-copy">Sessions protect authenticated actions across the platform</p></div></div>
      </div><div className="slide-number">09</div>
    </div>
  );
}