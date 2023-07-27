import { useState } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import ConstructionIcon from '@mui/icons-material/Construction';
import IconButton from '@mui/material/IconButton';
import DownloadingIcon from '@mui/icons-material/Downloading';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
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
        </MenuList>
      </Menu>
    </div>
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
        call['publisher']?.restartIce();
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
        call['subscriber']?.restartIce();
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
        call['publisher']?.getStats().then((stats: RTCStatsReport) => {
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

const LogSubscriberStats = () => {
  const call = useCall();
  return (
    <MenuItem
      onClick={() => {
        if (!call) return;
        call['subscriber']?.getStats().then((stats: RTCStatsReport) => {
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
