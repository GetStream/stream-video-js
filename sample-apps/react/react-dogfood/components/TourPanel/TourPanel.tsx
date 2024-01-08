import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { offset, Placement } from '@floating-ui/react';
import { computePosition } from '@floating-ui/dom';

import { useI18n } from '@stream-io/video-react-sdk';

import { useTourContext } from '../../context/TourContext';

export type Props = {
  highlightClass: string;
};

export const TourPanel = ({ highlightClass }: Props) => {
  const { t } = useI18n();

  const tourPanel = useRef<HTMLDivElement>(null);
  const [previousElement, setPreviousElement] = useState<Element | undefined>(
    undefined,
  );

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
      const tourPanelElement = tourPanel.current;
      if (!anchor || !tourPanelElement) return;
      const anchorElement = document.querySelector(anchor);
      if (anchorElement) {
        setPreviousElement(anchorElement);
        anchorElement.classList.add(highlightClass);

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
    [highlightClass],
  );

  useEffect(() => {
    if (previousElement) {
      previousElement.classList.remove(highlightClass);
    }
    setTimeout(() => {
      attachToElement(step?.anchor, step?.placement);
    }, step?.delay || 0);
  }, [
    current,
    step,
    attachToElement,
    tourPanel,
    previousElement,
    highlightClass,
  ]);

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
              src={step.image.src}
              alt={step.header}
            />
          </div>
        ) : null}
        {step?.component && step?.component()}
        {step?.explanation && (
          <p className="rd__tour__explanation">{step?.explanation}</p>
        )}
        <div className="rd__tour__footer">
          <button
            className={clsx('rd__button', {
              'rd__button--secondary': current !== total,
              'rd__button--primary': current === total,
            })}
            onClick={close}
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
  }
};
