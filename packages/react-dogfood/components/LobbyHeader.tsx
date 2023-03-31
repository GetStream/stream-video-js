import { MouseEvent, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import Avatar from '@mui/material/Avatar';
import { Box, Button, Link as MuiLink, Stack, Tooltip } from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import Logout from '@mui/icons-material/Logout';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SearchIcon from '@mui/icons-material/Search';
import SubjectIcon from '@mui/icons-material/Subject';
import { USAGE_GUIDE_LINK } from './index';

export const LobbyHeader = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        p: '.75rem',
      }}
    >
      <HomeButton />
      <Navbar />
      <UserInfo />
    </Box>
  );
};

export const HomeButton = () => (
  <Link href="/" data-testid="home-button">
    <Image src="/stream-logo.svg" alt="Stream logo" width={42} height={42} />
  </Link>
);

const Navbar = () => {
  const navbarLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#fff',
    fontWeight: '500',
    fontSize: '1rem',
    textTransform: 'uppercase',
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '1.75rem',
        paddingInline: '3rem;',
      }}
    >
      <Tooltip title={"Learn about the app's capabilities and shortcomings"}>
        <MuiLink href={USAGE_GUIDE_LINK} target="_blank" sx={navbarLinkStyle}>
          <SubjectIcon /> Guide
        </MuiLink>
      </Tooltip>
      <Tooltip title={'Search, share & download call recordngs'}>
        <MuiLink href="/call-recordings" target="_blank" sx={navbarLinkStyle}>
          <SearchIcon /> Recordings
        </MuiLink>
      </Tooltip>
    </Box>
  );
};

const UserInfo = () => {
  const { data: theSession } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!theSession || !theSession.user) {
    return null;
  }

  return (
    <Stack
      direction="row"
      gap={2}
      display={'flex'}
      alignItems={'center'}
      sx={{ alignItems: 'center' }}
    >
      <Stack sx={{ textAlign: 'end' }}>
        <Box sx={{ fontSize: '.875rem' }} data-testid="username">
          {theSession.user.name}
        </Box>
        <Box sx={{ fontSize: '0.75rem' }} data-testid="username">
          {theSession.user.email}
        </Box>
      </Stack>
      <Button
        onClick={handleClick}
        sx={{ padding: 0, margin: 0, width: 'fit-content', minWidth: 'unset' }}
      >
        <Avatar src={theSession.user.image} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            signOut();
            handleClose();
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Stack>
  );
};
