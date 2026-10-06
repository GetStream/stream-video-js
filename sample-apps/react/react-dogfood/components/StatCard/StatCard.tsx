import { ReactNode, useState } from 'react';
import clsx from 'clsx';
import { Icon } from '@stream-io/video-react-sdk';
import { useFloating, useHover, useInteractions } from '@floating-ui/react';
import { useAppI18n } from '../../hooks/useAppI18n';

export type StatCardTagVariant = 'good' | 'ok' | 'bad';

export type StatCardComparison = {
  value: number;
  lowBound: number;
  highBound: number;
};

/**
 * A grid of `StatCard`s.
 *
 * Column count and gap are custom properties set on any ancestor, so a host retunes the layout
 * without selecting into the cards: `--rd__stat-card-columns: 3`. The cards themselves size to the
 * track, which is why nothing here hands out a width.
 */
export const StatCardGrid = (props: { children: ReactNode }) => (
  <div className="rd__stat-card-grid">{props.children}</div>
);

export const StatCardTag = (props: {
  children: ReactNode;
  variant: StatCardTagVariant;
}) => {
  const { children, variant } = props;
  return (
    <div
      className={clsx('rd__stat-card__tag', `rd__stat-card__tag--${variant}`)}
    >
      {children}
    </div>
  );
};

/**
 * One labelled measurement.
 *
 * Self-contained by design: every rule in `style/StatCard.scss` is a single top-level class, so a
 * card looks the same wherever it is mounted and a host's own `.host .rd__stat-card__x` override
 * always wins on specificity rather than on stylesheet order.
 */
export const StatCard = (props: {
  label: string;
  value: string | ReactNode;
  description?: string;
  /** Renders a good/ok/bad tag derived from the value's distance to the bounds. */
  comparison?: StatCardComparison;
  /** An explicit tag, for values that aren't a measurement against bounds. Wins over `comparison`. */
  tag?: ReactNode;
}) => {
  const { label, value, description, comparison, tag } = props;

  const { t } = useAppI18n();

  return (
    <div className="rd__stat-card">
      <div className="rd__stat-card__content">
        <div className="rd__stat-card__label">
          {label}
          {description && <StatCardExplanation description={description} />}
        </div>
        <div className="rd__stat-card__value">{value}</div>
      </div>
      {tag ??
        (comparison && (
          <StatCardTag variant={toVariant(comparison)}>
            {variantLabel(toVariant(comparison), t)}
          </StatCardTag>
        ))}
    </div>
  );
};

const StatCardExplanation = (props: { description: string }) => {
  const { description } = props;
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const hover = useHover(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        <Icon className="rd__stat-card__explanation-icon" icon="info" />
      </div>
      {isOpen && (
        <div
          className="rd__stat-card__explanation"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          {description}
        </div>
      )}
    </>
  );
};

/**
 * The label rendered for a tag variant.
 *
 * A `switch` of literal `t()` calls rather than a runtime-valued `t()` lookup: the literal keys are
 * statically extractable, which is what makes these three translatable.
 */
const variantLabel = (
  variant: StatCardTagVariant,
  t: (key: string, defaultValue: string) => string,
): string => {
  switch (variant) {
    case 'good':
      return t('statCard.status.good.label', 'Good');
    case 'ok':
      return t('statCard.status.ok.label', 'Ok');
    case 'bad':
      return t('statCard.status.bad.label', 'Bad');
  }
};

const toVariant = (comparison: StatCardComparison): StatCardTagVariant => {
  const { value, lowBound, highBound } = comparison;
  if (value <= lowBound) return 'good';
  if (value <= highBound) return 'ok';
  return 'bad';
};
