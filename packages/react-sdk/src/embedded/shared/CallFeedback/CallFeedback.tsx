import { useCallback, useState } from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import { CallEndedScreen } from './CallEndedScreen';
import { RatingScreen } from './RatingScreen';
import { ThankYouScreen } from './ThankYouScreen';
import { useEmbeddedConfiguration } from '../../context';

export interface CallFeedbackProps {
  onJoin?: () => void;
}

type FeedbackState = 'ended' | 'rating' | 'submitted';

export const CallFeedback = ({ onJoin }: CallFeedbackProps) => {
  const call = useCall();
  const { onError } = useEmbeddedConfiguration();
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
        onError?.(err);
      } finally {
        setState('submitted');
      }
    },
    [call, onError],
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
