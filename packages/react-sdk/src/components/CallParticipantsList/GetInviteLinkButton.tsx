import * as React from 'react';
import { MouseEventHandler, useCallback, useState } from 'react';
import { Tooltip } from '../Tooltip';

export type GetInviteLinkButtonProps = React.ComponentProps<'button'> & {
  /** Custom function to override the logic of generating the call invitation link */
  generateLink?: () => string;
};

export const GetInviteLinkButton = ({
  generateLink,
  onClick,
  ...restProps
}: GetInviteLinkButtonProps) => {
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLSpanElement | null>(
    null,
  );

  const copyLinkToClipBoard = useCallback(async () => {
    let link = generateLink?.();
    if (!link) {
      link = window?.location.href || 'Could not generate invitation link.';
    }
    await navigator?.clipboard.writeText(link);
    return link;
  }, [generateLink]);

  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      const link = await copyLinkToClipBoard();
      const text = link
        ? 'Invite link copied to clipboard.'
        : 'Invite link copy failed';

      setTooltipText(text);
      setTimeout(() => setTooltipText(''), 1500);

      if (onClick) onClick(e);
    },
    [copyLinkToClipBoard, onClick, setTooltipText],
  );

  return (
    <button
      ref={setTooltipAnchor}
      className="str-video__invite-link-button"
      onClick={handleClick}
      {...restProps}
    >
      <Tooltip referenceElement={tooltipAnchor} visible={!!tooltipText}>
        {tooltipText}
      </Tooltip>
      <div className="str-video__invite-participant-icon" />
      <div className="str-video__invite-link-button__text">Invite Link</div>
    </button>
  );
};
