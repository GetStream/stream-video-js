import MoveUpIcon from '@mui/icons-material/MoveUp';
import { IconButton } from '@mui/material';
import { SfuModels, useCall } from '@stream-io/video-react-sdk';

export const SwapSfuButton = () => {
  const call = useCall();
  return (
    <IconButton
      color="primary"
      title="Migrate to a new SFU"
      onClick={() => {
        if (!call) return;
        call['dispatcher'].dispatch({
          eventPayload: {
            oneofKind: 'goAway',
            goAway: {
              reason: SfuModels.GoAwayReason.REBALANCE,
            },
          },
        });
      }}
    >
      <MoveUpIcon />
    </IconButton>
  );
};
