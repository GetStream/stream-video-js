import VideoCall from '@mui/icons-material/VideoCall';
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
import type { Participants } from '../App';

export const CreateCall = (props: {
  participants: Participants;
  currentUser: string;
  onCreateCall?: (callId: string, participants: string[]) => void;
}) => {
  const { participants, currentUser, onCreateCall } = props;
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

  return (
    <>
      <List
        subheader={<ListSubheader component="div">Participants</ListSubheader>}
      >
        {Object.entries(participants).map(([name, token]) => {
          return (
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
                    <Avatar>{name.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={name} />
                </ListItemButton>
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          );
        })}
      </List>
      <Button
        variant="contained"
        fullWidth
        disabled={!currentUser}
        startIcon={<VideoCall />}
        onClick={() => onCreateCall?.('id-' + Date.now(), selectedParticipants)}
      >
        Call
      </Button>
    </>
  );
};
