import { HTMLInputTypeAttribute, useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/router';

import { useField, useForm } from 'react-form';

import { Icon, useI18n } from '@stream-io/video-react-sdk';

import { getCookie } from '../../helpers/getCookie';

export type Props = {
  className?: string;
  callId?: string;
  inMeeting?: boolean;
  close?: () => void;
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
    validate: props.required
      ? (value: string) => required(value, name)
      : undefined,
  });

  const rootClassName = clsx(className, {
    'rd__feedback-error': isTouched && error,
  });

  return <input className={rootClassName} {...getInputProps()} {...rest} />;
};

const TextArea = (props: {
  className?: string;
  placeholder: string;
  name: string;
  required?: boolean;
}) => {
  const { name, className, ...rest } = props;
  const {
    meta: { error, isTouched },
    getInputProps,
  } = useField(name, {
    validate: props.required
      ? (value: string) => required(value, name)
      : undefined,
  });

  const rootClassName = clsx('rd__feedback-textarea', {
    'rd__feedback-error': isTouched && error,
  });

  return <textarea className={rootClassName} {...getInputProps()} {...rest} />;
};

export const Feedback = ({ callId, inMeeting = true, close }: Props) => {
  const [rating, setRating] = useState<{ current: number; maxAmount: number }>({
    current: 0,
    maxAmount: 5,
  });
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [errorMessage, setError] = useState<string | null>(null);

  const { t } = useI18n();
  const router = useRouter();

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

  const descriptionClassName = clsx('rd__feedback-description', {
    'rd__feedback-error': errorMessage,
  });

  if (feedbackSent) {
    return (
      <div className="rd__feedback rd__feedback--sent">
        <img
          className="rd__feedback-image"
          src="/feedback.png"
          alt="Feedback"
        />

        <h2 className="rd__feedback-heading">
          {t('Thanks for your feedback!')}
        </h2>
        <p className="rd__feedback-description">
          {t('We’ll use it to help better your call experience 😀')}
        </p>

        <button
          className="rd__button rd__button--primaryrd__feedback-button rd__feedback-button--close"
          disabled={isSubmitting}
          onClick={close}
        >
          {' '}
          {t('Close')}
        </button>
      </div>
    );
  }

  if (!feedbackSent) {
    return (
      <div className="rd__feedback">
        <img
          className="rd__feedback-image"
          src="/feedback.png"
          alt="Feedback"
        />
        <h4 className="rd__feedback-heading">
          {inMeeting ? t('How was your call?') : t('You left the call.')}
        </h4>
        <p className={descriptionClassName}>
          {errorMessage && errorMessage}
          {inMeeting && !errorMessage && 'How is your calling experience?'}
          {!inMeeting && !errorMessage && 'How was your calling experience?'}
        </p>
        <Form className="rd__feedback-form">
          <Input
            className="rd__feedback-input"
            name="email"
            type="email"
            placeholder={t('Email')}
            required
          />
          <TextArea
            className="rd__feedback-textarea"
            name="message"
            placeholder={t('Message')}
          />
          <div className="rd__feedback-footer">
            <div className="rd__feedback-rating">
              <p className="rd__feedback-rating-description">Rate quality:</p>
              <div className="rd__feedback-rating-stars">
                {[...new Array(rating.maxAmount)].map((_, index: number) => {
                  const active = index + 1 <= rating.current;
                  const starClassName = clsx('rd__feedback-star', {
                    'rd__feedback-star--active': active,
                  });

                  return (
                    <div
                      key={`star-${index}`}
                      onClick={() => handleSetRating(index + 1)}
                    >
                      <Icon icon="star" className={starClassName} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rd__feedback-actions">
              {inMeeting ? (
                <button
                  className="rd__button rd__button--secondary rd__feedback-button--cancel"
                  disabled={isSubmitting}
                  onClick={close}
                >
                  {' '}
                  {t('Cancel')}
                </button>
              ) : (
                <button
                  className="rd__button rd__button--secondary rd__feedback-button--cancel"
                  disabled={isSubmitting}
                  onClick={() => router.push(`/join/${callId}`)}
                >
                  <Icon className="rd__button__icon" icon="login" />
                  {t('Rejoin Call')}
                </button>
              )}

              <button
                className="rd__button rd__button--primary rd__feedback-button--submit"
                type="submit"
                disabled={isSubmitting}
                onClick={() => {}}
              >
                {' '}
                {t('Submit')}
              </button>
            </div>
          </div>
        </Form>
      </div>
    );
  }

  return null;
};
