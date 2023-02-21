import clsx from 'clsx';
import {
  ComponentProps,
  ComponentPropsWithRef,
  ComponentType,
  ForwardedRef,
  MouseEventHandler,
  useCallback,
  useState,
} from 'react';
import { Tooltip } from '../Tooltip';

export type GetInviteLinkButtonProps = ComponentProps<'button'> & {
  Button: ComponentType<
    ComponentPropsWithRef<'button'> & { ref: ForwardedRef<HTMLButtonElement> }
  >;
  dismissAfterMs?: number;
  /** Custom function to override the logic of generating the call invitation link */
  generateLink?: () => string;
};

export const GetInviteLinkButton = ({
  Button,
  dismissAfterMs = 1500,
  generateLink,
  onClick,
  ...restProps
}: GetInviteLinkButtonProps) => {
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLButtonElement | null>(
    null,
  );

  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      const link = generateLink?.() || window?.location.href;
      let text;
      try {
        await navigator?.clipboard.writeText(link);
        text = 'Invite link copied to clipboard.';
      } catch {
        text = 'Invite link copy failed';
      }

      setTooltipText(text);
      setTimeout(() => setTooltipText(''), dismissAfterMs);

      if (onClick) onClick(e);
    },
    [dismissAfterMs, generateLink, onClick],
  );

  return (
    <>
      <Tooltip
        className="str-video__invite-link-button__tooltip"
        referenceElement={tooltipAnchor}
        visible={!!tooltipText}
      >
        {tooltipText}
      </Tooltip>
      <Button
        {...restProps}
        ref={setTooltipAnchor}
        className={clsx('str-video__invite-link-button', restProps.className)}
        onClick={handleClick}
      />
    </>
  );
};
