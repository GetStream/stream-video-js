import { useCallback, useState } from 'react';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';

export interface CallFeedbackProps {
  onSkip?: () => void;
  onJoin?: () => void;
}

type FeedbackState = 'rating' | 'submitted' | 'skipped';

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

const RejoinSection = ({ onClick }: { onClick: () => void }) => {
  const { t } = useI18n();
  return (
    <div className="str-video__embedded-call-feedback__rejoin-section">
      <p className="str-video__embedded-call-feedback__rejoin-text">
        {t('Left by mistake?')}
      </p>
      <button
        type="button"
        className="str-video__embedded-call-feedback__rejoin-button"
        onClick={onClick}
      >
        <Icon icon="login" />
        {t('Rejoin call')}
      </button>
    </div>
  );
};

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
          {t('Your feedback helps improve call quality.')}
        </p>
      </div>
    </FeedbackLayout>
  );
};

const CallEndedScreen = ({ onRejoin }: { onRejoin?: () => void }) => {
  const { t } = useI18n();
  return (
    <FeedbackLayout>
      <div className="str-video__embedded-call-feedback__ended">
        <h2 className="str-video__embedded-call-feedback__title">
          {t('Call ended')}
        </h2>
        {onRejoin && <RejoinSection onClick={onRejoin} />}
      </div>
    </FeedbackLayout>
  );
};

interface RatingScreenProps {
  onSubmit: (rating: number) => void;
  onSkip: () => void;
  onRejoin?: () => void;
}

const RatingScreen = ({ onSubmit, onSkip, onRejoin }: RatingScreenProps) => {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (rating > 0) onSubmit(rating);
  };

  return (
    <FeedbackLayout>
      <h2 className="str-video__embedded-call-feedback__title">
        {t('Call ended')}
      </h2>

      <StarRating value={rating} onChange={setRating} />

      <div className="str-video__embedded-call-feedback__actions">
        <button
          type="button"
          className="str-video__embedded-call-feedback__button str-video__embedded-call-feedback__button--primary"
          onClick={handleSubmit}
          disabled={rating === 0}
        >
          {t('Submit feedback')}
        </button>
        <button
          type="button"
          className="str-video__embedded-call-feedback__skip"
          onClick={onSkip}
        >
          {t('Skip')}
        </button>
      </div>

      {onRejoin && <RejoinSection onClick={onRejoin} />}
    </FeedbackLayout>
  );
};

export const CallFeedback = ({ onSkip, onJoin }: CallFeedbackProps) => {
  const call = useCall();
  const [state, setState] = useState<FeedbackState>('rating');

  const handleSubmit = useCallback(
    async (rating: number) => {
      const clampedRating = Math.min(Math.max(1, rating), 5);
      try {
        await call?.submitFeedback(clampedRating);
      } catch (err) {
        console.error('Failed to submit feedback:', err);
      }
      setState('submitted');
    },
    [call],
  );

  const handleSkip = useCallback(() => {
    onSkip?.();
    setState('skipped');
  }, [onSkip]);

  switch (state) {
    case 'submitted':
      return <ThankYouScreen />;
    case 'skipped':
      return <CallEndedScreen onRejoin={onJoin} />;
    default:
      return (
        <RatingScreen
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          onRejoin={onJoin}
        />
      );
  }
};
