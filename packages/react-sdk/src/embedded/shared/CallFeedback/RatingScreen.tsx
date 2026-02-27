import { useState } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import { StarRating } from './StarRating';

interface RatingScreenProps {
  onSubmit: (rating: number, message: string) => void;
}

export const RatingScreen = ({ onSubmit }: RatingScreenProps) => {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (rating > 0) onSubmit(rating, message);
  };

  return (
    <div className="str-video__embedded-call-feedback__container">
      <h2 className="str-video__embedded-call-feedback__title">
        {t('Share your feedback')}
      </h2>

      <StarRating value={rating} onChange={setRating} />

      <textarea
        aria-label={t('Feedback message')}
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
  );
};
