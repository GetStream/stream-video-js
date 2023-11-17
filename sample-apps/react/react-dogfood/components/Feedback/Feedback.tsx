import {
  FC,
  HTMLInputTypeAttribute,
  useCallback,
  useState,
  useMemo,
} from 'react';
import clsx from 'clsx';
import { useForm, useField } from 'react-form';

import { IconButton, Icon } from '@stream-io/video-react-sdk';

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

const Input: FC<{
  className?: string;
  type: HTMLInputTypeAttribute;
  placeholder: string;
  name: string;
  required?: boolean;
}> = (props) => {
  const { name, className, ...rest } = props;
  const {
    meta: { error, isTouched },
    getInputProps,
  } = useField(name, {
    validate: props.required
      ? (value: string) => required(value, name)
      : undefined,
  });

  const rootClassName = clsx(className, {
    'str-video__feedback-error': isTouched && error,
  });

  return <input className={rootClassName} {...getInputProps()} {...rest} />;
};

const TextArea: FC<{
  className?: string;
  placeholder: string;
  name: string;
  required?: boolean;
}> = (props) => {
  const { name, className, ...rest } = props;
  const {
    meta: { error, isTouched },
    getInputProps,
  } = useField(name, {
    validate: props.required
      ? (value: string) => required(value, name)
      : undefined,
  });

  const rootClassName = clsx('str-video__feedback', {
    'str-video__feedback-error': isTouched && error,
  });

  return <textarea className={rootClassName} {...getInputProps()} {...rest} />;
};

export const Feedback: FC<Props> = ({
  className,
  callId,
  inMeeting,
}: Props) => {
  const [rating, setRating] = useState<{ current: number; maxAmount: number }>({
    current: 0,
    maxAmount: 5,
  });
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [errorMessage, setError] = useState<string | null>(null);

  const endpointUrl =
    process.env.MODE === 'staging' || process.env.MODE === 'development'
      ? 'https://staging.getstream.io'
      : 'https://getstream.io';
  const {
    Form,
    meta: { isSubmitting },
  } = useForm({
    defaultValues: useMemo(
      () => ({
        email: '',
        message: '',
      }),
      [],
    ),
    onSubmit: async (values: object) => {
      const response = await fetch(`${endpointUrl}/api/crm/video_feedback/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({
          ...values,
          page_url: `${endpointUrl}?meeting=${inMeeting ? 'true' : 'false'}${
            callId ? `&id=${callId}` : ''
          }`,
        }),
      });

      if (response.status >= 400) {
        setError('Something went wrong, please try again.');
      } else {
        setFeedbackSent(true);
      }
    },
    debugForm: false,
  });

  const handleSetRating = useCallback(
    (value: number) => {
      setRating({
        ...rating,
        current: value,
      });
    },
    [rating],
  );

  const rootClassName = clsx('str-video__feedback', className);
  const sentClassName = clsx('str-video__feedback-sent', className);

  const descriptionClassName = clsx('str-video__feedback-description', {
    ['str-video__feedback-error']: errorMessage,
  });

  if (feedbackSent) {
    return (
      <div className={sentClassName}>
        <div className="str-video__feedback-heading">
          <h2 className="str-video__feedback-header">
            Your message was successfully sent 👍
          </h2>
          {true ? (
            <IconButton
              icon="close"
              className="str-video__feedback-close"
              onClick={() => {}}
            />
          ) : null}
        </div>
        <p className="str-video__feedback-description">
          Thank you for letting us know how we can continue to improve our
          product and deliver the best calling experience possible. Hope you had
          a good call.
        </p>
      </div>
    );
  }

  if (!feedbackSent) {
    return (
      <div className={rootClassName}>
        <h4 className="str-video__feedback-heading">
          How was your calling experience?
        </h4>
        <p className={descriptionClassName}>
          {errorMessage
            ? errorMessage
            : 'We are eager to improve our video product.'}
        </p>
        <Form className="str-video__feedback-form">
          <Input
            className="str-video__feedback-input"
            name="email"
            type="email"
            placeholder="Email Address (required)"
            required
          />
          <TextArea
            className="str-video__feedback-textarea"
            name="message"
            placeholder="Let us know what we can do to make it better"
          />
          <div className="str-video__feedback-footer">
            <div className="str-video__feedback-rating">
              <p className="str-video__feedback-rating-description">
                Rate your call quality:
              </p>
              <div className="str-video__feedback-rating-stars">
                {[...new Array(rating.maxAmount)].map(
                  (amount, index: number) => {
                    const active = index + 1 <= rating.current;
                    const starClassName = clsx('str-video__feedback-star', {
                      ['str-video__feedback-active']: active,
                    });

                    return (
                      <div
                        key={`star-${index}`}
                        onClick={() => handleSetRating(index + 1)}
                      >
                        <Icon icon="star" className={starClassName} />
                      </div>
                    );
                  },
                )}
              </div>
            </div>
            <button
              className="str-video__feedback-button"
              type="submit"
              disabled={isSubmitting}
              onClick={() => {}}
            >
              {' '}
              submit
            </button>
          </div>
        </Form>
      </div>
    );
  }

  return null;
};
