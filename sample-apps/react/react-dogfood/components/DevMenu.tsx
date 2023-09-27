import { useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import ConstructionIcon from '@mui/icons-material/Construction';
import IconButton from '@mui/material/IconButton';
import DownloadingIcon from '@mui/icons-material/Downloading';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import Menu from '@mui/material/Menu';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import LanIcon from '@mui/icons-material/Lan';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

export const DevMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = !!anchorEl;
  return (
    <div className="df-dev-menu">
      <IconButton
        id="dev-debug-menu-button"
        color="primary"
        title="Debug"
        aria-controls={open ? 'dev-debug-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
        }}
      >
        <ConstructionIcon />
      </IconButton>
      <Menu
        id="dev-debug-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': 'dev-debug-menu-button',
        }}
      >
        <MenuList>
          {/*<MigrateToNewSfu />*/}
          {/*<FastReconnect />*/}
          {/*<Divider />*/}
          <RestartPublisher />
          <RestartSubscriber />
          <Divider />
          <ConnectToLocalSfu sfuId="SFU-1" port={3031} />
          <ConnectToLocalSfu sfuId="SFU-2" port={3033} />
          <ConnectToLocalSfu sfuId="SFU-3" port={3036} />
          <Divider />
          <LogPublisherStats />
          <LogSubscriberStats />
          <Divider />
          <StartStopBroadcasting />
          <GoOrStopLive />
        </MenuList>
      </Menu>
    </div>
  );
};

const StartStopBroadcasting = () => {
  const call = useCall();
  const { useIsCallBroadcastingInProgress } = useCallStateHooks();
  const isBroadcasting = useIsCallBroadcastingInProgress();
  return (
    <MenuItem
      onClick={() => {
        if (!call) return;
        if (isBroadcasting) {
          call.stopHLS().catch((err) => {
            console.error(`Failed to start broadcasting`, err);
          });
        } else {
          call
            .startHLS()
            .then((res) => {
              console.log(`Broadcasting started: ${res.playlist_url}`);
            })
            .catch((err) => {
              console.error(`Failed to stop broadcasting`, err);
            });
        }
      }}
    >
      <ListItemIcon>
        {isBroadcasting ? <EndBroadcastIcon /> : <StartBroadcastIcon />}
      </ListItemIcon>
      <ListItemText>
        {isBroadcasting ? 'Stop broadcasting' : 'Start broadcasting'}
      </ListItemText>
    </MenuItem>
  );
};

const GoOrStopLive = () => {
  const call = useCall();
  const { useIsCallLive } = useCallStateHooks();
  const isLive = useIsCallLive();
  return (
    <MenuItem
      onClick={() => {
        if (!call) return;
        if (isLive) {
          call.stopLive().catch((err) => {
            console.error(`Failed to stop live`, err);
          });
        } else {
          call
            .goLive()
            .then((res) => {
              console.log(`Live started: ${res}`);
            })
            .catch((err) => {
              console.error(`Failed to start live`, err);
            });
        }
      }}
    >
      <ListItemIcon>
        {isLive ? <CancelPresentationIcon /> : <LiveTvIcon />}
      </ListItemIcon>
      <ListItemText>{isLive ? 'Stop Live' : 'Go Live'}</ListItemText>
    </MenuItem>
  );
};

// const MigrateToNewSfu = () => {
//   const call = useCall();
//   return (
//     <MenuItem
//       hidden
//       onClick={() => {
//         if (!call) return;
//         call['dispatcher'].dispatch({
//           eventPayload: {
//             oneofKind: 'goAway',
//             goAway: {
//               reason: SfuModels.GoAwayReason.REBALANCE,
//             },
//           },
//         });
//       }}
//     >
//       <ListItemIcon>
//         <SwitchAccessShortcutIcon
//           fontSize="small"
//           sx={{
//             transform: 'rotate(90deg)',
//           }}
//         />
//       </ListItemIcon>
//       <ListItemText>Migrate to a new SFU</ListItemText>
//     </MenuItem>
//   );
// };
//

// const EmulateSFUShuttingDown = () => {
//   const call = useCall();
//   return (
//     <MenuItem
//       onClick={() => {
//         if (!call) return;
//         call['dispatcher'].dispatch({
//           eventPayload: {
//             oneofKind: 'error',
//             error: {
//               code: SfuModels.ErrorCode.SFU_SHUTTING_DOWN,
//             },
//           },
//         });
//       }}
//     >
//       <ListItemIcon>
//         <PowerSettingsNewIcon fontSize="small" />
//       </ListItemIcon>
//       <ListItemText>Emulate SFU shutdown</ListItemText>
//     </MenuItem>
//   );
// };

const ConnectToLocalSfu = (props: { port?: number; sfuId?: string }) => {
  const { port = 3031, sfuId = 'SFU-1' } = props;
  const params = new URLSearchParams(window.location.search);
  return (
    <MenuItem
      onClick={() => {
        params.set('sfuUrl', `http://127.0.0.1:${port}/twirp`);
        params.set('sfuWsUrl', `ws://127.0.0.1:${port}/ws`);
        window.location.search = params.toString();
      }}
    >
      <ListItemIcon>
        <LanIcon />
      </ListItemIcon>
      <ListItemText>Connect to local {sfuId}</ListItemText>
    </MenuItem>
  );
};

const RestartPublisher = () => {
  const call = useCall();
  return (
    <MenuItem
      onClick={() => {
        if (!call) return;
        call.publisher?.restartIce();
      }}
    >
      <ListItemIcon>
        <DownloadingIcon
          fontSize="small"
          sx={{
            transform: 'rotate(180deg)',
          }}
        />
      </ListItemIcon>
      <ListItemText>ICERestart Publisher</ListItemText>
    </MenuItem>
  );
};

const RestartSubscriber = () => {
  const call = useCall();
  return (
    <MenuItem
      onClick={() => {
        if (!call) return;
        call.subscriber?.restartIce();
      }}
    >
      <ListItemIcon>
        <DownloadingIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>ICERestart Subscriber</ListItemText>
    </MenuItem>
  );
};

const LogPublisherStats = () => {
  const call = useCall();
  return (
    <MenuItem
      onClick={() => {
        if (!call) return;
        call.publisher?.getStats().then((stats: RTCStatsReport) => {
          const arr: any = [];
          stats.forEach((value) => {
            arr.push(value);
          });
          console.log('Publisher stats', arr);
        });
      }}
    >
      <ListItemIcon>
        <QueryStatsIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Log Publisher stats</ListItemText>
    </MenuItem>
  );
};

const StartBroadcastIcon = () => {
  return (
    <svg
      width="25"
      height="18"
      viewBox="0 0 25 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.2 14.2996C5.8375 12.9496 5 11.0746 5 8.99961C5 6.92461 5.8375 5.04961 7.2 3.69961L8.975 5.47461C8.0625 6.37461 7.5 7.62461 7.5 8.99961C7.5 10.3746 8.0625 11.6246 8.9625 12.5371L7.2 14.2996ZM17.8 14.2996C19.1625 12.9496 20 11.0746 20 8.99961C20 6.92461 19.1625 5.04961 17.8 3.69961L16.025 5.47461C16.9375 6.37461 17.5 7.62461 17.5 8.99961C17.5 10.3746 16.9375 11.6246 16.0375 12.5371L17.8 14.2996ZM12.5 6.49961C11.125 6.49961 10 7.62461 10 8.99961C10 10.3746 11.125 11.4996 12.5 11.4996C13.875 11.4996 15 10.3746 15 8.99961C15 7.62461 13.875 6.49961 12.5 6.49961ZM22.5 8.99961C22.5 11.7621 21.375 14.2621 19.5625 16.0621L21.3375 17.8371C23.6 15.5746 25 12.4496 25 8.99961C25 5.54961 23.6 2.42461 21.3375 0.162109L19.5625 1.93711C21.375 3.73711 22.5 6.23711 22.5 8.99961ZM5.4375 1.93711L3.6625 0.162109C1.4 2.42461 0 5.54961 0 8.99961C0 12.4496 1.4 15.5746 3.6625 17.8371L5.4375 16.0621C3.625 14.2621 2.5 11.7621 2.5 8.99961C2.5 6.23711 3.625 3.73711 5.4375 1.93711Z"
        fill="#0000008a"
      />
    </svg>
  );
};

const EndBroadcastIcon = () => {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.55615 10.8184C8.44365 11.2309 8.38115 11.6684 8.38115 12.1184C8.38115 13.4934 8.94365 14.7434 9.84365 15.6559L8.06865 17.4309C6.71865 16.0684 5.88115 14.1934 5.88115 12.1184C5.88115 10.9559 6.14365 9.86836 6.60615 8.88086L4.76865 7.04336C3.88115 8.53086 3.38115 10.2684 3.38115 12.1184C3.38115 14.8809 4.50615 17.3809 6.31865 19.1809L4.54365 20.9559C2.28115 18.6934 0.881152 15.5684 0.881152 12.1184C0.881152 9.56836 1.64365 7.20586 2.95615 5.23086L0.118652 2.39336L1.88115 0.630859L24.8562 23.6059L23.0937 25.3684L8.55615 10.8184ZM20.1562 15.3559C20.6187 14.3684 20.8812 13.2809 20.8812 12.1184C20.8812 10.0434 20.0437 8.16836 18.6812 6.81836L16.9062 8.59336C17.8187 9.49336 18.3812 10.7434 18.3812 12.1184C18.3812 12.5684 18.3187 13.0059 18.2062 13.4184L20.1562 15.3559ZM23.3812 12.1184C23.3812 13.9684 22.8812 15.7059 21.9937 17.1934L23.8062 19.0059C25.1187 17.0309 25.8812 14.6684 25.8812 12.1184C25.8812 8.66836 24.4812 5.54336 22.2187 3.28086L20.4437 5.05586C22.2562 6.85586 23.3812 9.35586 23.3812 12.1184Z"
        fill="#0000008a"
      />
    </svg>
  );
};

const LogSubscriberStats = () => {
  const call = useCall();
  return (
    <MenuItem
      onClick={() => {
        if (!call) return;
        call.subscriber?.getStats().then((stats: RTCStatsReport) => {
          const arr: any = [];
          stats.forEach((value) => {
            arr.push(value);
          });
          console.log('Subscriber stats', arr);
        });
      }}
    >
      <ListItemIcon>
        <QueryStatsIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Log Subscriber stats</ListItemText>
    </MenuItem>
  );
};
