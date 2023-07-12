import { useState } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import ConstructionIcon from '@mui/icons-material/Construction';
import IconButton from '@mui/material/IconButton';
import DownloadingIcon from '@mui/icons-material/Downloading';
import Menu from '@mui/material/Menu';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
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
// const FastReconnect = () => {
//   const call = useCall();
//   return (
//     <MenuItem
//       onClick={() => {
//         if (!call) return;
//         const sfuClient = call['sfuClient'] as StreamSfuClient | undefined;
//         if (!sfuClient) return;
//         sfuClient.isReconnecting = true;
//         call['joinInternal']();
//       }}
//     >
//       <ListItemIcon>
//         <AutoModeIcon fontSize="small" />
//       </ListItemIcon>
//       <ListItemText>Fast-reconnect</ListItemText>
//     </MenuItem>
//   );
// };

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
