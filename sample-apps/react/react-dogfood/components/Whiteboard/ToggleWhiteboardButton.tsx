/**
 * Media-control toggle that opens/closes the shared whiteboard for everyone.
 */
import {
  CompositeButton,
  useI18n,
  WithTooltip,
} from '@stream-io/video-react-sdk';

import type { WhiteboardApi } from './useWhiteboard';

const WhiteboardIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <rect
      x="3"
      y="4"
      width="18"
      height="13"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
    <path
      d="M8 21h8M12 17v4"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
    <path
      d="M7 13l4-4 1.8 1.8L16 7.6"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
  </svg>
);

export const ToggleWhiteboardButton = (props: { wb: WhiteboardApi }) => {
  const { wb } = props;
  const { t } = useI18n();
  return (
    <WithTooltip title={t('Whiteboard')}>
      <CompositeButton
        active={wb.isOpen}
        variant="primary"
        disabled={!wb.ready}
        onClick={() => (wb.isOpen ? wb.close() : wb.open())}
        data-testid="whiteboard-toggle-button"
      >
        <WhiteboardIcon />
      </CompositeButton>
    </WithTooltip>
  );
};
