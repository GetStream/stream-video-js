import './SpyOverlay.css';

export const SpyOverlay = () => (
  <div className="spy-overlay">
    <span className="spy-overlay__lock">🔒</span>
    <span className="spy-overlay__title">Admitted, no keys</span>
    <span className="spy-overlay__sub">
      in the call, but peers&apos; media is undecryptable
    </span>
  </div>
);
