import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { offset, OffsetOptions, Placement } from '@floating-ui/react';
import { computePosition } from '@floating-ui/dom';

import { useI18n } from '@stream-io/video-react-sdk';

import { useTourContext } from '../../context/TourContext';

export type Props = {
  highlightClass: string;
};

export const TourPanel = ({ highlightClass }: Props) => {
  const { t } = useI18n();

  const tourPanel = useRef<HTMLDivElement>(null);
  const [previousElement, setPreviousElement] = useState<Element>();

  const { next, current, step, closeTour, total, active } = useTourContext();

  const attachToElement = useCallback(
    (anchor?: string, placement?: Placement, offsetOptions?: OffsetOptions) => {
      const tourPanelElement = tourPanel.current;
      if (!anchor || !tourPanelElement) return;
      const anchorElement = document.querySelector(anchor);
      if (!anchorElement) return;

      setPreviousElement(anchorElement);
      anchorElement.classList.add(highlightClass);
      computePosition(anchorElement, tourPanelElement, {
        placement,
        middleware: [offset(offsetOptions)],
      }).then(({ x, y }) => {
        Object.assign(tourPanelElement.style, {
          transform: `translate3d(${x}px, ${y}px, 0)`,
        });
      });
    },
    [highlightClass],
  );

  const [showOverlay, setShowOverlay] = useState(false);
  useEffect(() => {
    const panel = tourPanel.current;
    if (!panel) return;
    const onStart = () => setShowOverlay(true);
    const onEnd = () => setShowOverlay(false);
    panel.addEventListener('transitionstart', onStart);
    panel.addEventListener('transitionend', onEnd);
    return () => {
      panel.removeEventListener('transitionstart', onStart);
      panel.removeEventListener('transitionend', onEnd);
    };
  }, []);

  useEffect(() => {
    if (previousElement) {
      previousElement.classList.remove(highlightClass);
    }

    if (!step) return;
    const id = setTimeout(() => {
      attachToElement(step.anchor, step.placement, step.offset);
    }, 0);
    return () => clearTimeout(id);
  }, [step, attachToElement, previousElement, highlightClass]);

  if (!active) return null;

  return (
    <div
      ref={tourPanel}
      className={clsx('rd__tour', current <= 1 && 'rd__tour--first-step')}
    >
      <div
        className={`rd__tour__indicator rd__tour__indicator--${step?.placement}`}
      />

      {step && (
        <div className="rd__tour__content-container">
          <h2 className="rd__tour__header">{step?.header}</h2>
          {step.image && (
            <div className="rd__tour__image-container">
              <img
                className="rd__tour__image"
                src={step.image.src}
                alt={step.header}
              />
            </div>
          )}
          {step.component && step?.component()}
          {step.explanation && (
            <p className="rd__tour__explanation">{step?.explanation}</p>
          )}
          {showOverlay && <div className="rd__tour__step-overlay" />}
        </div>
      )}
      <div className="rd__tour__footer">
        <button
          className={clsx('rd__button', {
            'rd__button--secondary': current !== total,
            'rd__button--primary': current === total,
          })}
          onClick={closeTour}
        >
          {current === total ? t('Finish') : t('Skip intro')}
        </button>

        {current !== total && (
          <button className="rd__button rd__button--primary" onClick={next}>
            {t('Next')}
          </button>
        )}
      </div>
    </div>
  );
};
