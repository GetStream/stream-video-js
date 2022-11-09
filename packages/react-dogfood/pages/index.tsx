import { useSession, signIn } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

import PhotoCameraFrontIcon from '@mui/icons-material/PhotoCameraFront';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import {
  Box,
  Stack,
  Typography,
  Button,
  Divider,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Unstable_Grid2 as Grid,
} from '@mui/material';
import Link from 'next/link';
import { meetingId } from '../lib/meetingId';

const subtitles = [
  'Because we love seeing each other.',
  'You look amazing today!',
  'Everyone appreciates your work!',
  'Thank you for being with us!',
  'Your new haircut suits you well!',
  'Did you tidy up your background?',
];

export default function Home() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'unauthenticated') {
      void signIn();
    }
  }, [status]);

  if (!session) {
    return null;
  }
  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      spacing={2}
      flexGrow={1}
    >
      <Stack spacing={2}>
        <Box padding={2}>
          <Typography variant="h2">Stream Meetings</Typography>
          <Typography variant="subtitle1">
            {subtitles[Math.round(Math.random() * (subtitles.length - 1))]}
          </Typography>
        </Box>
        <Divider />
        <Grid container alignItems="center" rowSpacing={3} columnSpacing={3}>
          <Grid xs={12} md={5}>
            <Link href={`/join/${meetingId()}`}>
              <Button variant="contained" fullWidth>
                <PhotoCameraFrontIcon sx={{ mr: 1 }} />
                New meeting
              </Button>
            </Link>
          </Grid>
          <JoinCall />
        </Grid>
      </Stack>
    </Stack>
  );
}

const JoinCall = () => {
  const ref = useRef<HTMLInputElement>();
  const router = useRouter();
  const [disabled, setDisabled] = useState(true);
  const onJoin = useCallback(() => {
    router.push(`join/${ref.current.value}`);
  }, [ref, router]);
  return (
    <>
      <Grid xs={9} md={5}>
        <Box>
          <FormControl fullWidth>
            <InputLabel htmlFor="outlined-adornment-amount">
              Or join a call with code
            </InputLabel>
            <OutlinedInput
              inputRef={ref}
              onChange={(e) =>
                setDisabled(() => {
                  return e.target.value.length < 3;
                })
              }
              onKeyUp={(e) => {
                if (e.key === 'Enter') {
                  onJoin();
                }
              }}
              size="small"
              startAdornment={
                <InputAdornment position="start">
                  <InsertEmoticonIcon />
                </InputAdornment>
              }
              label="Or join a call with code"
            />
          </FormControl>
        </Box>
      </Grid>
      <Grid xs={3} md={2}>
        <Button variant="text" onClick={onJoin} disabled={disabled}>
          Join
        </Button>
      </Grid>
    </>
  );
};
