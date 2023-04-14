import { FC, HTMLInputTypeAttribute, useCallback, useState } from 'react';
import classnames from 'classnames';
import { useForm, useField } from 'react-form';

import Button from '../Button';
import { Star, Close } from '../Icons';

import { useModalContext } from '../../contexts/ModalContext';

import styles from './Feedback.module.css';

export type Props = {
  className?: string;
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
    validate: props.required ? (value) => required(value, name) : undefined,
  });

  const rootClassName = classnames(className, {
    [styles.error]: isTouched && error,
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
    validate: props.required ? (value) => required(value, name) : undefined,
  });

  const rootClassName = classnames(className, {
    [styles.error]: isTouched && error,
  });

  return <textarea className={rootClassName} {...getInputProps()} {...rest} />;
};

export const Feedback: FC<Props> = ({ className }) => {
  const [rating, setRating] = useState<{ current: number; maxAmount: number }>({
    current: 0,
    maxAmount: 5,
  });
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  const { close, isVisible } = useModalContext();

  const {
    Form,
    meta: { isSubmitting, canSubmit },
  } = useForm({
    onSubmit: async (values, instance) => {
      setFeedbackSent(true);
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

  const rootClassName = classnames(styles.feedback, className);
  const sentClassName = classnames(styles.sent, className);

  if (feedbackSent) {
    return (
      <div className={sentClassName}>
        <div className={styles.heading}>
          <h2 className={styles.header}>
            Your message was successfully sent 👍
          </h2>
          {isVisible ? (
            <Button
              shape="square"
              className={styles.close}
              color="transparent"
              onClick={close}
            >
              <Close className={styles.closeIcon} />
            </Button>
          ) : null}
        </div>
        <p className={styles.description}>
          Thank you for letting us know how we can continue to improve our
          product and deliver the best calling experience possible. Hope you had
          a good call.
        </p>
      </div>
    );
  }

  if (feedbackSent === false) {
    return (
      <div className={rootClassName}>
        <h4 className={styles.heading}>How was your calling experience?</h4>
        <p className={styles.description}>
          We are eager to improve our video product.
        </p>
        <Form className={styles.form}>
          <Input
            className={styles.input}
            name="email"
            type="email"
            placeholder="Email Address (required)"
            required
          />
          <TextArea
            className={styles.textarea}
            name="reason"
            placeholder="Let us know what we can do to make it better"
          />
          <div className={styles.footer}>
            <div className={styles.rating}>
              <p className={styles.ratingDescription}>
                Rate your call quality:
              </p>
              <div className={styles.ratingStars}>
                {[...new Array(rating.maxAmount)].map((_, index: number) => {
                  const active = index + 1 <= rating.current;
                  const starClassName = classnames(styles.star, {
                    [styles.active]: active,
                  });

                  return (
                    <div onClick={() => handleSetRating(index + 1)}>
                      <Star className={starClassName} />
                    </div>
                  );
                })}
              </div>
            </div>
            <Button
              className={styles.button}
              type="submit"
              color="primary"
              shape="oval"
              onClick={() => {}}
            >
              {' '}
              submit
            </Button>
          </div>
        </Form>
      </div>
    );
  }

  return null;
};
