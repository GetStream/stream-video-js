import { FormEvent, useCallback, useState } from 'react';
import clsx from 'clsx';
import { Icon, useCall, useMenuContext } from '@stream-io/video-react-sdk';
import { getCookie } from '../../helpers/getCookie';

export type Props = {
  className?: string;
  callId?: string;
  inMeeting?: boolean;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const Feedback = ({ callId, inMeeting = true }: Props) => {
  const [rating, setRating] = useState({ current: 0, maxAmount: 5 });
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feedbackSent, setFeedbackSent] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);
  const call = useCall();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      await call
        ?.submitFeedback(Math.min(Math.max(1, rating.current), 5), {
          reason: message,
          custom: {
            message,
            email,
          },
        })
        .catch((err) => console.warn(`Failed to submit call feedback`, err));

      const pageUrl = new URL(window.location.href);
      pageUrl.searchParams.set('meeting', inMeeting ? 'true' : 'false');
      pageUrl.searchParams.set('id', callId || call?.id || '');

      await fetch(`https://getstream.io/api/crm/video_feedback/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({
          email: email || 'anonymous-feedback@getstream.io',
          message: message || '<no-message-provided>',
          rating: rating.current,
          page_url: pageUrl.toString(),
        }),
      });

      setFeedbackSent(true);
    } catch (error) {
      console.warn(`Failed to submit call feedback`, error);
      setError('Something went wrong, please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetRating = useCallback((value: number) => {
    setRating((currentRating) => ({ ...currentRating, current: value }));
  }, []);

  const { close } = useMenuContext();

  if (feedbackSent) {
    return (
      <div className="rd__feedback rd__feedback--sent">
        <img
          className="rd__feedback-image"
          src={`${basePath}/feedback.png`}
          alt="Feedback"
        />

        <h2 className="rd__feedback-heading">Thanks for your feedback!</h2>
        <p className="rd__feedback-description">
          We’ll use it to help better your call experience 😀
        </p>

        <div className="rd__feedback-footer">
          <div className="rd__feedback-actions">
            <button
              className="rd__button rd__button--secondary"
              type="button"
              disabled={isSubmitting}
            >
              Learn More
            </button>

            <button
              className="rd__button rd__button--primary"
              type="button"
              disabled={isSubmitting}
              onClick={
                close ||
                (() => {
                  window.location.href = 'https://getstream.io/video/';
                })
              }
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rd__feedback">
      <img
        className="rd__feedback-image"
        src={`${basePath}/feedback.png`}
        alt="Feedback"
      />
      <h4 className="rd__feedback-heading">
        {inMeeting ? 'How was your call?' : 'You left the call.'}
      </h4>
      <p
        className={clsx(
          'rd__feedback-description',
          errorMessage && 'rd__feedback-error',
        )}
      >
        {errorMessage && errorMessage}
        {inMeeting && !errorMessage && 'How is your calling experience?'}
        {!inMeeting && !errorMessage && 'How was your calling experience?'}
      </p>
      <form className="rd__feedback-form" onSubmit={handleSubmit}>
        <div className="rd__feedback-rating-stars">
          {[...new Array(rating.maxAmount)].map((_, index) => {
            const grade = index + 1;
            const active = grade <= rating.current;
            const color = (v: number) =>
              v <= 2 ? 'bad' : v > 2 && v <= 4 ? 'good' : 'great';
            const modifier = color(grade);
            const activeModifier = color(rating.current);
            return (
              <div key={index} onClick={() => handleSetRating(grade)}>
                <Icon
                  icon="star"
                  className={clsx(
                    'rd__feedback-star',
                    `rd__feedback-star--${modifier}`,
                    active && `rd__feedback-star--active-${activeModifier}`,
                  )}
                />
              </div>
            );
          })}
        </div>
        <input
          type="email"
          value={email}
          placeholder="Email"
          id="feedback_input"
          className="rd__feedback-input"
          onChange={(e) => setEmail(e.target.value)}
        />
        <textarea
          value={message}
          placeholder="Message"
          id="feedback_message"
          className="rd__feedback-textarea"
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="rd__feedback-footer">
          <div className="rd__feedback-actions">
            {inMeeting ? (
              <button
                className="rd__button rd__button--secondary"
                disabled={isSubmitting}
                onClick={close}
              >
                Cancel
              </button>
            ) : (
              <button
                className="rd__button rd__button--secondary"
                disabled={isSubmitting}
                onClick={() => {
                  window.location.assign('https://getstream.io/video/#contact');
                }}
              >
                Contact an expert
              </button>
            )}
            <button
              className="rd__button rd__button--primary"
              type="submit"
              disabled={rating.current === 0 || isSubmitting}
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
