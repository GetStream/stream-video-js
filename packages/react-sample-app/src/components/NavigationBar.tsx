import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Groups';

export const NavigationBar = () => {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        <GroupIcon
          sx={{
            marginRight: '36px',
          }}
        />
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          noWrap
          sx={{ flexGrow: 1 }}
        >
          Stream Video App
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
