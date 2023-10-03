import { useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { IconButton } from '@mui/material';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import Menu from '@mui/material/Menu';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import PanoramaIcon from '@mui/icons-material/Panorama';
import ListItemText from '@mui/material/ListItemText';

export const CallSettingsButton = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = !!anchorEl;
  return (
    <div className="df-call-settings">
      <IconButton
        id="call-settings-button"
        sx={{ color: 'white' }}
        title="Call Settings"
        aria-controls={open ? 'call-settings-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
        }}
      >
        <SettingsSuggestIcon />
      </IconButton>
      <Menu
        id="call-settings-menu"
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': 'call-settings-button',
        }}
      >
        <MenuList>
          <ToggleCallThumbnails />
        </MenuList>
      </Menu>
    </div>
  );
};

const ToggleCallThumbnails = () => {
  const call = useCall();
  const { useCallSettings } = useCallStateHooks();
  const settings = useCallSettings();
  const thumbnailsEnabled = !!settings?.thumbnails.enabled;
  return (
    <MenuItem
      onClick={() => {
        if (!call) return;
        call
          .update({
            settings_override: { thumbnails: { enabled: !thumbnailsEnabled } },
          })
          .catch((err) => {
            console.error(`Failed to update call thumbnail settings`, err);
          });
      }}
    >
      <ListItemIcon>
        <PanoramaIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        {thumbnailsEnabled ? 'Disable Thumbnails' : 'Enable Thumbnails'}
      </ListItemText>
    </MenuItem>
  );
};
