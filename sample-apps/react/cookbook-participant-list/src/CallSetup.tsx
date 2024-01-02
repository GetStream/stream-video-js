import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

export type CallSetupProps = {
  onJoin: (callId: string) => void;
};

const randomId = () => Math.random().toString(36).substring(2, 12);

export const CallSetup = (props: CallSetupProps) => {
  const [callId, setCallId] = useState(() => {
    const params = new URLSearchParams(
      window.location.search || window.location.hash,
    );

    return params.get('call_id') || params.get('#call_id') || randomId();
  });
  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      flexGrow={1}
    >
      <Stack spacing={2}>
        <Typography variant="h3" textAlign="center">
          Join a Call
        </Typography>
        <Input
          placeholder="Enter Call ID"
          value={callId}
          onChange={(e) => {
            setCallId(e.target.value);
          }}
        />
        <Button
          variant="outlined"
          disabled={!callId}
          onClick={() => {
            props.onJoin(callId);
          }}
        >
          Join
        </Button>
      </Stack>
    </Stack>
  );
};
