import { useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { Placement, offset } from '@floating-ui/react';
import { computePosition } from '@floating-ui/dom';

import { useI18n } from '@stream-io/video-react-sdk';

import { useTourContext } from '../../context/TourContext';

export const TourPanel = () => {
  const { t } = useI18n();

  const tourPanel: any = useRef(null);

  const {
    next,
    current,
    step,
    toggleTour: close,
    total,
    active,
  } = useTourContext();

  const attachToElement = useCallback(
    (anchor?: string, placement?: Placement) => {
      if (!anchor || !tourPanel) return;
      const tourPanelElement = tourPanel.current;

      const anchorElement = document.querySelector(anchor);
      if (anchorElement) {
        computePosition(anchorElement, tourPanelElement, {
          placement,
          middleware: [offset(10)],
        }).then(({ x, y }) => {
          Object.assign(tourPanelElement.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
        });
      }
    },
    [],
  );

  useEffect(() => {
    setTimeout(() => {
      attachToElement(step?.anchor, step?.placement);
    }, step?.delay || 0);
  }, [current, step, attachToElement, tourPanel]);

  if (active) {
    return (
      <div ref={tourPanel} className="rd__tour">
        <div
          className={`rd__tour__indicator rd__tour__indicator--${step?.placement}`}
        />

        <h2 className="rd__tour__header">{step?.header}</h2>
        {step && step.image ? (
          <div className="rd__tour__image-container">
            <img
              className="rd__tour__image"
              src={step?.image?.src}
              alt={step?.header}
            />
          </div>
        ) : null}
        <p className="rd__tour__explanation">{step?.explanation}</p>
        <div className="rd__tour__footer">
          <button
            className={clsx('rd__button', {
              'rd__button--secondary': current !== total,
              'rd__button--primary': current === total,
            })}
            onClick={close}
          >
            {current === total ? t('Finish intro') : t('Skip intro')}
          </button>

          {current !== total && (
            <button className="rd__button rd__button--primary" onClick={next}>
              {t('Next')}
            </button>
          )}
        </div>
      </div>
    );
  }
};
