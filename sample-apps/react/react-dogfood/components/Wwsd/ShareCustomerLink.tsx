import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useAppI18n } from '../../hooks/useAppI18n';
import { useWwsd } from './WwsdContext';

export const ShareCustomerLink = () => {
  const { t } = useAppI18n();
  const { actions, isPending } = useWwsd();
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState(false);
  const [link, setLink] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!audience) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAudience(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [audience]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !link) {
      actions
        .fetchCustomerLink()
        .then(setLink)
        .catch((err) => console.warn('[wwsd] customer link failed', err));
    }
  };

  const copy = () => {
    if (!link) return;
    navigator.clipboard
      .writeText(link)
      .then(() => setCopied(true))
      .catch((err) => console.warn('[wwsd] copy failed', err));
  };

  return (
    <div className="rd__wwsd-share">
      <button className="rd__button rd__button--secondary" onClick={toggle}>
        📱 {t('wwsd.share.button', 'Customer link')}
      </button>
      {open && (
        <div className="rd__wwsd-share__popover">
          {!link && (
            <p className="rd__wwsd-muted">
              {isPending('links')
                ? t('wwsd.share.loading', 'Getting the link...')
                : t('wwsd.share.missing', 'No customer link yet.')}
            </p>
          )}
          {link && (
            <>
              <QRCodeSVG value={link} size={180} marginSize={2} />
              <input className="rd__input" readOnly value={link} />
              <div className="rd__wwsd-share__row">
                <button className="rd__button" onClick={copy}>
                  {copied
                    ? t('wwsd.share.copied', 'Copied ✓')
                    : t('wwsd.share.copy', 'Copy')}
                </button>
                <button
                  className="rd__button rd__button--primary"
                  onClick={() => setAudience(true)}
                >
                  {t('wwsd.share.audience', 'Audience QR')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {audience && link && (
        <div
          className="rd__wwsd-audience"
          role="dialog"
          onClick={() => setAudience(false)}
        >
          <p>{t('wwsd.share.scan', 'Scan to be the customer')}</p>
          <QRCodeSVG value={link} size={420} marginSize={4} />
        </div>
      )}
    </div>
  );
};
