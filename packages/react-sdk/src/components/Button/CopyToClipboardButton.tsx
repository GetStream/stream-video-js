import {
  ComponentProps,
  ComponentPropsWithRef,
  ComponentType,
  ForwardedRef,
  forwardRef,
  MouseEventHandler,
  useCallback,
  useState,
} from 'react';
import clsx from 'clsx';
import { Placement } from '@floating-ui/react';

import { Tooltip } from '../Tooltip';

type CopyToClipboardButtonProps = ComponentProps<'button'> & {
  /** Custom button component implementation. Will be rendered instead of native button element */
  Button?: ComponentType<
    ComponentPropsWithRef<'button'> & { ref: ForwardedRef<HTMLButtonElement> }
  >;
  /** Custom function to override the logic of generating the call invitation link */
  copyValue: (() => string) | string;
  /** Callback invoked if the copy-to-clipboard action fails */
  onError?: (button: HTMLButtonElement, e: Error) => void;
  /** Callback invoked if the copy-to-clipboard action succeeds */
  onSuccess?: (button: HTMLButtonElement) => void;
};

export const CopyToClipboardButton = forwardRef<
  HTMLButtonElement,
  CopyToClipboardButtonProps
>(
  (
    { Button, className, copyValue, onClick, onError, onSuccess, ...restProps },
    ref,
  ) => {
    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
      async (event) => {
        if (onClick) onClick(event);
        const value = typeof copyValue === 'function' ? copyValue() : copyValue;
        try {
          await navigator?.clipboard.writeText(value);
          onSuccess?.(event.target as HTMLButtonElement);
        } catch (error) {
          onError?.(event.target as HTMLButtonElement, error as Error);
        }
      },
      [copyValue, onClick, onError, onSuccess],
    );

    const props = {
      ...restProps,
      ref: ref,
      className: clsx('str-video__copy-to-clipboard-button', className),
      onClick: handleClick,
    };

    return Button ? <Button {...props} /> : <button {...props} />;
  },
);

type CopyToClipboardButtonWithPopupProps = Exclude<
  CopyToClipboardButtonProps,
  'onError' | 'onSuccess'
> & {
  dismissAfterMs?: number;
  /** String displayed when copy-to-clipboard action fails */
  onErrorMessage?: string;
  /** String displayed when copy-to-clipboard succeeds fails */
  onSuccessMessage?: string;
  /** Class applied to the popup container element */
  popupClassName?: string;
  // todo: We should replace Placement for internal type
  popupPlacement?: Placement;
};

export const CopyToClipboardButtonWithPopup = ({
  dismissAfterMs = 1500,
  onErrorMessage = 'Failed to copy',
  onSuccessMessage = 'Copied to clipboard',
  popupClassName,
  popupPlacement,
  ...restProps
}: CopyToClipboardButtonWithPopupProps) => {
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLButtonElement | null>(
    null,
  );

  const setTemporaryPopup = useCallback(
    (popupText: string) => {
      setTooltipText(popupText);
      setTimeout(() => setTooltipText(''), dismissAfterMs);
    },
    [dismissAfterMs],
  );

  const onSuccess = useCallback(
    () => setTemporaryPopup(onSuccessMessage),
    [onSuccessMessage, setTemporaryPopup],
  );

  const onError = useCallback(
    () => setTemporaryPopup(onErrorMessage),
    [onErrorMessage, setTemporaryPopup],
  );

  return (
    <>
      <Tooltip
        tooltipClassName={clsx(
          'str-video__copy-to-clipboard-button__popup',
          popupClassName,
        )}
        tooltipPlacement={popupPlacement}
        referenceElement={tooltipAnchor}
        visible={!!tooltipText}
      >
        {tooltipText}
      </Tooltip>
      <CopyToClipboardButton
        {...restProps}
        onError={onError}
        onSuccess={onSuccess}
        ref={setTooltipAnchor}
      />
    </>
  );
};
