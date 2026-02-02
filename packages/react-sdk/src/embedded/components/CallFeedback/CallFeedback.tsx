import { useCallback, useState } from 'react';

export interface CallFeedbackProps {
  onSubmit?: (rating: number) => void;
  onSkip?: () => void;
  onRejoin?: () => void;
}

type FeedbackState = 'rating' | 'submitted' | 'skipped';

const FeedbackLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="str-video__call-feedback">
    <div className="str-video__call-feedback__container">{children}</div>
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

const RejoinLink = ({ onClick }: { onClick: () => void }) => (
  <p className="str-video__call-feedback__rejoin">
    Left by mistake?{' '}
    <button
      type="button"
      className="str-video__call-feedback__rejoin-link"
      onClick={onClick}
    >
      Rejoin call
    </button>
  </p>
);

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

const StarRating = ({ value, onChange }: StarRatingProps) => {
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || value;

  return (
    <div className="str-video__call-feedback__rating-section">
      <p className="str-video__call-feedback__rating-label">
        How was your call quality?
      </p>
      <div
        className="str-video__call-feedback__stars"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`str-video__call-feedback__star${
              star <= displayValue
                ? ' str-video__call-feedback__star--active'
                : ''
            }`}
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

const ThankYouScreen = () => (
  <FeedbackLayout>
    <div className="str-video__call-feedback__thank-you">
      <div className="str-video__call-feedback__checkmark">
        <CheckmarkIcon />
      </div>
      <h2 className="str-video__call-feedback__title">
        Thanks for your feedback
      </h2>
      <p className="str-video__call-feedback__subtitle">
        Your input helps us improve the call experience.
      </p>
    </div>
  </FeedbackLayout>
);

const CallEndedScreen = ({ onRejoin }: { onRejoin?: () => void }) => (
  <FeedbackLayout>
    <div className="str-video__call-feedback__ended">
      <h2 className="str-video__call-feedback__title">Call ended</h2>
      {onRejoin && <RejoinLink onClick={onRejoin} />}
    </div>
  </FeedbackLayout>
);

interface RatingScreenProps {
  onSubmit: (rating: number) => void;
  onSkip: () => void;
  onRejoin?: () => void;
}

const RatingScreen = ({ onSubmit, onSkip, onRejoin }: RatingScreenProps) => {
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (rating > 0) onSubmit(rating);
  };

  return (
    <FeedbackLayout>
      <h2 className="str-video__call-feedback__title">Call ended</h2>

      <StarRating value={rating} onChange={setRating} />

      <div className="str-video__call-feedback__actions">
        <button
          type="button"
          className="str-video__call-feedback__button str-video__call-feedback__button--primary"
          onClick={handleSubmit}
          disabled={rating === 0}
        >
          Submit feedback
        </button>
        <button
          type="button"
          className="str-video__call-feedback__button str-video__call-feedback__button--secondary"
          onClick={onSkip}
        >
          Skip
        </button>
      </div>

      {onRejoin && <RejoinLink onClick={onRejoin} />}
    </FeedbackLayout>
  );
};

export const CallFeedback = ({
  onSubmit,
  onSkip,
  onRejoin,
}: CallFeedbackProps) => {
  const [state, setState] = useState<FeedbackState>('rating');

  const handleSubmit = useCallback(
    (rating: number) => {
      onSubmit?.(rating);
      setState('submitted');
    },
    [onSubmit],
  );

  const handleSkip = useCallback(() => {
    onSkip?.();
    setState('skipped');
  }, [onSkip]);

  switch (state) {
    case 'submitted':
      return <ThankYouScreen />;
    case 'skipped':
      return <CallEndedScreen onRejoin={onRejoin} />;
    default:
      return (
        <RatingScreen
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          onRejoin={onRejoin}
        />
      );
  }
};
