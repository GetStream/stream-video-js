import React, { useEffect, useState } from 'react';
import {
  Button,
  List,
  ListItem,
  ListSubheader,
  TextField,
} from '@mui/material';
import SwitchVideo from '@mui/icons-material/SwitchVideo';
import { Call } from '@stream-io/video-client';

export const JoinCall = (props: {
  joinCall?: (id: string, type: string) => void;
  currentCall?: Call;
}) => {
  const { joinCall, currentCall } = props;
  const [callId, setCallId] = useState('');
  useEffect(() => {
    if (currentCall?.id) {
      setCallId(currentCall.id);
    }
  }, [currentCall]);
  return (
    <>
      <List
        subheader={<ListSubheader component="div">Join call</ListSubheader>}
      >
        <ListItem>
          <TextField
            label="Call ID"
            variant="outlined"
            fullWidth
            value={callId}
            onChange={(e) => setCallId(e.target.value)}
          />
        </ListItem>
      </List>
      <Button
        variant="contained"
        fullWidth
        startIcon={<SwitchVideo />}
        sx={{ mt: 1 }}
        disabled={!callId || !joinCall}
        onClick={() => {
          if (joinCall && callId) {
            joinCall(callId, currentCall?.type ?? 'default');
          }
        }}
      >
        Join call
      </Button>
    </>
  );
};
