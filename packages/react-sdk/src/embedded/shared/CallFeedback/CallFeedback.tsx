import { useCallback, useState } from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import { CallEndedScreen } from './CallEndedScreen';
import { RatingScreen } from './RatingScreen';
import { ThankYouScreen } from './ThankYouScreen';

export interface CallFeedbackProps {
  onJoin?: () => Promise<void>;
}

type FeedbackState = 'ended' | 'rating' | 'submitted';

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

  return (
    <div className="str-video__embedded-call-feedback">
      {state === 'submitted' ? (
        <ThankYouScreen />
      ) : state === 'rating' ? (
        <RatingScreen onSubmit={handleSubmit} />
      ) : (
        <CallEndedScreen onJoin={onJoin} onFeedback={onFeedback} />
      )}
    </div>
  );
};
