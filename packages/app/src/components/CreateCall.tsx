import {
  Avatar,
  Button,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import VideoCall from '@mui/icons-material/VideoCall';
import { useStreamVideoClient } from '@stream-io/video-components-react';
import type { Participants } from '../App';

export const CreateCall = (props: {
  participants: Participants;
  currentUser: string;
}) => {
  const { participants, currentUser } = props;
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    Object.keys(participants),
  );

  const toggleParticipant = useCallback(
    (name: string) => {
      if (name === currentUser) return;

      if (selectedParticipants.indexOf(name) === -1) {
        setSelectedParticipants((ps) => [...ps, name]);
      } else {
        setSelectedParticipants((ps) => ps.filter((i) => i !== name));
      }
    },
    [currentUser, selectedParticipants],
  );

  const client = useStreamVideoClient();
  const initiateCall = useCallback(
    async (id: string) => {
      try {
        await client?.createCall({
          id,
          type: 'video',
          participantIds: selectedParticipants,
        });
      } catch (err) {
        console.error(`Failed to create a call`, err);
      }
    },
    [client, selectedParticipants],
  );

  return (
    <>
      <List
        subheader={<ListSubheader component="div">Participants</ListSubheader>}
      >
        {Object.entries(participants).map(([name, token]) => (
          <React.Fragment key={token}>
            <ListItem
              disablePadding
              secondaryAction={
                <Checkbox
                  edge="end"
                  disabled={!currentUser}
                  onChange={() => toggleParticipant(name)}
                  checked={selectedParticipants.indexOf(name) !== -1}
                />
              }
            >
              <ListItemButton onClick={() => toggleParticipant(name)}>
                <ListItemAvatar>
                  <Avatar>{name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={name} />
              </ListItemButton>
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
      <Button
        variant="contained"
        fullWidth
        disabled={!currentUser}
        startIcon={<VideoCall />}
        onClick={() => initiateCall('random-id-' + Date.now())}
      >
        Call
      </Button>
    </>
  );
};
