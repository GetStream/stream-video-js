import { useState } from 'react';
import clsx from 'clsx';
import { useI18n } from '../../../i18n';
import { Icon } from '../../../components';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

export const StarRating = ({ value, onChange }: StarRatingProps) => {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || value;

  const getStarClasses = (star: number) =>
    clsx(
      'str-video__embedded-call-feedback__star',
      star <= displayValue && 'str-video__embedded-call-feedback__star--active',
    );

  return (
    <div className="str-video__embedded-call-feedback__rating-section">
      <p className="str-video__embedded-call-feedback__rating-label">
        {t(
          'callFeedback.starRating.howWasCallQuality.text',
          'How was your call quality?',
        )}
      </p>
      <div
        className="str-video__embedded-call-feedback__stars"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={getStarClasses(star)}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            aria-label={t('callFeedback.starRating.rateStars.ariaLabel', {
              count: star,
              defaultValue_one: 'Rate {{ count }} star',
              defaultValue_other: 'Rate {{ count }} stars',
            })}
          >
            <Icon icon="star-filled" />
          </button>
        ))}
      </div>
    </div>
  );
};
