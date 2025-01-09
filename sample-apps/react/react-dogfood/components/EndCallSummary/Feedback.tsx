import { HTMLInputTypeAttribute, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useField, useForm } from 'react-form';
import { useCall, Icon } from '@stream-io/video-react-sdk';
import { getCookie } from '../../helpers/getCookie';
import { FeedbackType } from './FeedbackType';

export type Props = {
  className?: string;
  callId?: string;
  rating?: number;
  submitSuccess: () => void;
  callData?: any;
  onClose: () => void;
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
      className={clsx(
        className,
        isTouched && error && 'rd__summary-feedback-error',
      )}
      {...getInputProps()}
      {...rest}
    />
  );
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
    validate: props.required ? (value) => required(value, name) : undefined,
  });

  return (
    <textarea
      className={clsx(
        'rd__summary-feedback-textarea',
        isTouched && error && 'rd__summary-feedback-error',
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

export const Feedback = ({
  className,
  callId,
  rating,
  submitSuccess,
  callData,
  onClose,
}: Props) => {
  const [errorMessage, setError] = useState<string | null>(null);
  const [selectedFeedbackTypes, setSelectedFeedbackTypes] = useState<
    string[] | undefined
  >(undefined);
  const call = useCall();
  const defaultValues = useMemo<FeedbackFormType>(
    () => ({
      email: '',
      message: '',
      rating: 0,
      selectedFeedbackTypes: undefined,
      callData: undefined,
    }),
    [],
  );
  const {
    Form,
    meta: { isSubmitting },
  } = useForm({
    defaultValues,
    onSubmit: async (values: FeedbackFormType) => {
      await call
        ?.submitFeedback(Math.min(Math.max(1, rating || 1), 5), {
          reason: values.message,
          custom: {
            ...values,
            callData: callData,
            selectedFeedbackTypes: selectedFeedbackTypes,
          },
        })
        .catch((err) => console.warn(`Failed to submit call feedback`, err));

      const pageUrl = new URL(window.location.href);
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
            rating: rating,
            page_url: pageUrl.toString(),
            selected_feedback_types: selectedFeedbackTypes,
            call_data: callData,
          }),
        },
      );
      if (response.status >= 400) {
        setError('Something went wrong, please try again.');
      } else {
        submitSuccess();
      }
    },
    debugForm: false,
  });

  return (
    <div className={clsx('rd__summary-feedback', className)}>
      <div className="rd__summary-feedback-close" onClick={onClose}>
        <Icon icon="close" />
      </div>
      <div className="rd__summary-feedback-header">
        <img
          className="rd__summary-feedback-image"
          src={`${basePath}/feedback.png`}
          alt="Feedback"
        />
        <h4 className="rd__summary-feedback-heading">
          Let us know what went wrong?
        </h4>
        <p
          className={clsx(
            'rd__summary-feedback-description',
            errorMessage && 'rd__summary-feedback-error',
          )}
        >
          {errorMessage && errorMessage}
          {!errorMessage && 'We value your feedback'}
        </p>
      </div>
      <FeedbackType
        className="rd__summary-feedback-type"
        handelSelectFeedback={(types) => setSelectedFeedbackTypes(types)}
      />

      <Form className="rd__summary-feedback-form">
        <Input
          className="rd__summary-feedback-input"
          name="email"
          type="email"
          placeholder="Email"
        />
        <TextArea
          className="rd__summary-feedback-textarea"
          name="message"
          placeholder="Message"
        />
        <div className="rd__summary-feedback-footer">
          <p className="rd__summary-feedback-consent">
            By proceeding, you consent to sharing call data with your feedback.
          </p>
          <div className="rd__summary-feedback-actions">
            <button
              className="rd__summary-feedback-submit"
              type="submit"
              disabled={isSubmitting}
            >
              Submit Feedback
            </button>
          </div>
        </div>
      </Form>
    </div>
  );
};
