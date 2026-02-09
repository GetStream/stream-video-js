import { useCallback, useState } from 'react';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';

export interface CallFeedbackProps {
  onJoin?: () => void;
}

type FeedbackState = 'ended' | 'rating' | 'submitted';

const FeedbackLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="str-video__embedded-call-feedback">
    <div className="str-video__embedded-call-feedback__container">
      {children}
    </div>
  </div>
);

const CheckmarkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

const StarRating = ({ value, onChange }: StarRatingProps) => {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || value;

  const getStarClasses = (star: number) => {
    const classes = ['str-video__embedded-call-feedback__star'];
    if (star <= displayValue) {
      classes.push('str-video__embedded-call-feedback__star--active');
    }
    return classes.join(' ');
  };

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
            <StarIcon filled={star <= displayValue} />
          </button>
        ))}
      </div>
    </div>
  );
};

const ThankYouScreen = () => {
  const { t } = useI18n();
  return (
    <FeedbackLayout>
      <div className="str-video__embedded-call-feedback__thank-you">
        <div className="str-video__embedded-call-feedback__checkmark">
          <CheckmarkIcon />
        </div>
        <h2 className="str-video__embedded-call-feedback__title">
          {t('Thank you!')}
        </h2>
        <p className="str-video__embedded-call-feedback__subtitle">
          {t('Your CallFeedback helps improve call quality.')}
        </p>
      </div>
    </FeedbackLayout>
  );
};

const FeedbackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
  </svg>
);

interface CallEndedScreenProps {
  onRejoin?: () => void;
  onLeaveFeedback: () => void;
}

const CallEndedScreen = ({
  onRejoin,
  onLeaveFeedback,
}: CallEndedScreenProps) => {
  const { t } = useI18n();
  return (
    <FeedbackLayout>
      <div className="str-video__embedded-call-feedback__ended">
        <h2 className="str-video__embedded-call-feedback__title">
          {t('Call ended')}
        </h2>
        <div className="str-video__embedded-call-feedback__ended-actions">
          {onRejoin && (
            <>
              <div className="str-video__embedded-call-feedback__ended-column">
                <p className="str-video__embedded-call-feedback__ended-label">
                  {t('Left by mistake?')}
                </p>
                <button
                  type="button"
                  className="str-video__embedded-call-feedback__ended-button"
                  onClick={onRejoin}
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
              onClick={onLeaveFeedback}
            >
              <FeedbackIcon />
              {t('Leave feedback')}
            </button>
          </div>
        </div>
      </div>
    </FeedbackLayout>
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
    <FeedbackLayout>
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
    </FeedbackLayout>
  );
};

export const CallFeedback = ({ onJoin }: CallFeedbackProps) => {
  const call = useCall();
  const [state, setState] = useState<FeedbackState>('ended');

  const handleSubmit = useCallback(
    async (rating: number, message: string) => {
      const clampedRating = Math.min(Math.max(1, rating), 5);
      try {
        await call?.submitFeedback(clampedRating, {
          reason: message,
          custom: { message },
        });
      } catch (err) {
        console.error('Failed to submit feedback:', err);
      }
      setState('submitted');
    },
    [call],
  );

  switch (state) {
    case 'submitted':
      return <ThankYouScreen />;
    case 'rating':
      return <RatingScreen onSubmit={handleSubmit} />;
    default:
      return (
        <CallEndedScreen
          onRejoin={onJoin}
          onLeaveFeedback={() => setState('rating')}
        />
      );
  }
};
