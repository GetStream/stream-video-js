import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';
import { useEmbeddedConfiguration } from '../../context';

export interface CallFeedbackProps {
  onJoin?: () => Promise<void>;
}

type FeedbackState = 'ended' | 'rating' | 'submitted';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

const StarRating = ({ value, onChange }: StarRatingProps) => {
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
        {t('How was your call quality?')}
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
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Icon icon="star-filled" />
          </button>
        ))}
      </div>
    </div>
  );
};

const ThankYouScreen = () => {
  const { t } = useI18n();
  return (
    <div className="str-video__embedded-call-feedback">
      <div className="str-video__embedded-call-feedback__container">
        <div className="str-video__embedded-call-feedback__checkmark">
          <Icon icon="checkmark" />
        </div>
        <h2 className="str-video__embedded-call-feedback__title">
          {t('Thank you!')}
        </h2>
        <p className="str-video__embedded-call-feedback__subtitle">
          {t('Your feedback helps improve call quality.')}
        </p>
      </div>
    </div>
  );
};

interface CallEndedScreenProps {
  onJoin?: () => Promise<void>;
  onFeedback: () => void;
}

const CallEndedScreen = ({ onJoin, onFeedback }: CallEndedScreenProps) => {
  const { t } = useI18n();

  const [error, setError] = useState(false);
  const { onError } = useEmbeddedConfiguration();

  const handleRejoin = useCallback(async () => {
    if (!onJoin) return;

    try {
      await onJoin();
    } catch (err) {
      onError?.(err);
      setError(true);
    }
  }, [onJoin, onError]);

  return (
    <div className="str-video__embedded-call-feedback">
      <div className="str-video__embedded-call-feedback__container">
        <h2 className="str-video__embedded-call-feedback__title">
          {t('Call ended')}
        </h2>
        <p
          className="str-video__embedded-call-feedback__rejoin-error"
          role="status"
          aria-live="polite"
          data-visible={error}
        >
          {t('Failed to rejoin. Please try again.')}
        </p>
        <div className="str-video__embedded-call-feedback__ended-actions">
          {handleRejoin && (
            <>
              <div className="str-video__embedded-call-feedback__ended-column">
                <p className="str-video__embedded-call-feedback__ended-label">
                  {t('Left by mistake?')}
                </p>
                <button
                  type="button"
                  className="str-video__embedded-call-feedback__ended-button"
                  onClick={handleRejoin}
                >
                  <Icon icon="login" />
                  {t('Rejoin call')}
                </button>
              </div>
              <div className="str-video__embedded-call-feedback__ended-divider" />
            </>
          )}
          <div className="str-video__embedded-call-feedback__ended-column">
            <p className="str-video__embedded-call-feedback__ended-label">
              {t('Help us improve')}
            </p>
            <button
              type="button"
              className="str-video__embedded-call-feedback__ended-button"
              onClick={onFeedback}
            >
              <Icon icon="feedback" />
              {t('Leave feedback')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RatingScreenProps {
  onSubmit: (rating: number, message: string) => void;
}

const RatingScreen = ({ onSubmit }: RatingScreenProps) => {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (rating > 0) onSubmit(rating, message);
  };

  return (
    <div className="str-video__embedded-call-feedback">
      <div className="str-video__embedded-call-feedback__container">
        <h2 className="str-video__embedded-call-feedback__title">
          {t('Share your feedback')}
        </h2>

        <StarRating value={rating} onChange={setRating} />

        <textarea
          className="str-video__embedded-call-feedback__textarea"
          placeholder={t('Tell us about your experience...')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />

        <div className="str-video__embedded-call-feedback__actions">
          <button
            type="button"
            className="str-video__button"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            {t('Submit feedback')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CallFeedback = ({ onJoin }: CallFeedbackProps) => {
  const call = useCall();
  const [state, setState] = useState<FeedbackState>('ended');

  const onFeedback = useCallback(() => setState('rating'), []);
  const handleSubmit = useCallback(
    async (rating: number, message: string) => {
      if (!call) return;

      const clampedRating = Math.min(Math.max(1, rating), 5);
      try {
        await call.submitFeedback(clampedRating, {
          reason: message,
          custom: { message },
        });
      } catch (err) {
        console.error('Failed to submit feedback:', err);
      } finally {
        setState('submitted');
      }
    },
    [call],
  );

  switch (state) {
    case 'submitted':
      return <ThankYouScreen />;
    case 'rating':
      return <RatingScreen onSubmit={handleSubmit} />;
    default:
      return <CallEndedScreen onJoin={onJoin} onFeedback={onFeedback} />;
  }
};
