import { HTMLInputTypeAttribute, useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useField, useForm } from 'react-form';
import { Icon, useCall, useMenuContext } from '@stream-io/video-react-sdk';
import { getCookie } from '../../helpers/getCookie';

export type Props = {
  className?: string;
  callId?: string;
  inMeeting?: boolean;
};

function required(value: string | number, name: string) {
  if (!value) {
    return `Please enter a ${name}`;
  }
  return false;
}

const Input = (props: {
  className?: string;
  type: HTMLInputTypeAttribute;
  placeholder: string;
  name: string;
  required?: boolean;
}) => {
  const { name, className, ...rest } = props;
  const {
    meta: { error, isTouched },
    getInputProps,
  } = useField(name, {
    validate: props.required ? (value) => required(value, name) : undefined,
  });

  return (
    <input
      className={clsx(className, isTouched && error && 'rd__feedback-error')}
      {...getInputProps()}
      {...rest}
    />
  );
};

const TextArea = (props: {
  placeholder: string;
  name: string;
  required?: boolean;
}) => {
  const { name, ...rest } = props;
  const {
    meta: { error, isTouched },
    getInputProps,
  } = useField(name, {
    validate: props.required ? (value) => required(value, name) : undefined,
  });

  return (
    <textarea
      className={clsx(
        'rd__feedback-textarea',
        isTouched && error && 'rd__feedback-error',
      )}
      {...getInputProps()}
      {...rest}
    />
  );
};

type FeedbackFormType = {
  email?: string;
  message?: string;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const Feedback = ({ callId, inMeeting = true }: Props) => {
  const [rating, setRating] = useState({ current: 0, maxAmount: 5 });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);
  const call = useCall();
  const defaultValues = useMemo<FeedbackFormType>(
    () => ({ email: '', message: '' }),
    [],
  );
  const {
    Form,
    meta: { isSubmitting },
  } = useForm({
    defaultValues,
    onSubmit: async (values: FeedbackFormType) => {
      await call
        ?.submitFeedback(Math.min(Math.max(1, rating.current), 5), {
          reason: values.message,
          custom: {
            ...values,
          },
        })
        .catch((err) => console.warn(`Failed to submit call feedback`, err));

      const pageUrl = new URL(window.location.href);
      pageUrl.searchParams.set('meeting', inMeeting ? 'true' : 'false');
      pageUrl.searchParams.set('id', callId || call?.id || '');

      const response = await fetch(
        `https://getstream.io/api/crm/video_feedback/`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
          },
          body: JSON.stringify({
            email: values.email || 'anonymous-feedback@getstream.io',
            message: values.message || '<no-message-provided>',
            rating: rating.current,
            page_url: pageUrl.toString(),
          }),
        },
      );
      if (response.status >= 400) {
        setError('Something went wrong, please try again.');
      } else {
        setFeedbackSent(true);
      }
    },
    debugForm: false,
  });

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
      <Form className="rd__feedback-form">
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
        <Input
          className="rd__feedback-input"
          name="email"
          type="email"
          placeholder="Email"
        />
        <TextArea name="message" placeholder="Message" />
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
      </Form>
    </div>
  );
};
