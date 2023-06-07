import { Button, Input, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export const SetupLivestream = () => {
  const [callId, setCallId] = useState<string>(() =>
    Math.random().toString(36).substring(2, 12),
  );

  return (
    <Stack justifyContent="center" alignItems="center" flexGrow={1} spacing={3}>
      <Typography variant="h3">Setup Livestream</Typography>
      <Input
        placeholder="Enter Call ID"
        value={callId}
        onChange={(e) => {
          setCallId(e.target.value);
        }}
      />
      <Link to={`backstage/${callId}`}>
        <Button variant="contained" disabled={!callId}>
          Enter backstage
        </Button>
      </Link>
    </Stack>
  );
};
