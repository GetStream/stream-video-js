/* eslint-disable jsx-a11y/anchor-is-valid */
import { signOut, useSession } from 'next-auth/react';
import { Box, Button, Divider, Stack } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';

const UserInfo = () => {
  const { data: theSession } = useSession();

  if (!theSession || !theSession.user) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      paddingRight={2}
      display={'flex'}
      alignItems={'center'}
      divider={<Divider orientation="vertical" />}
      sx={{ alignItems: 'center' }}
    >
      <Box data-testid="username">{theSession.user.email}</Box>
      <Button
        data-testid="sign-out-button"
        size="small"
        variant="contained"
        onClick={() => signOut()}
      >
        Sign out
      </Button>
    </Stack>
  );
};

export const LobbyHeader = () => {
  return (
    <Stack direction="row" spacing={2} paddingTop={1.5}>
      <Box flexGrow={1} paddingLeft={2}>
        <HomeButton />
      </Box>
      <UserInfo />
    </Stack>
  );
};

export const HomeButton = () => (
  <Link href="/" data-testid="home-button">
    <a style={{ lineHeight: '1' }}>
      <Image src="/stream-logo.svg" alt="Stream logo" width={42} height={42} />
    </a>
  </Link>
);
