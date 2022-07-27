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
import React, { useCallback, useEffect, useState } from 'react';
import CallAccept from '@mui/icons-material/Call';
import VideoCall from '@mui/icons-material/VideoCall';
import { ParticipantJoined } from '@stream-io/video-client';
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

  const [inCallParticipants, setInCallParticipants] = useState<string[]>([]);

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

  useEffect(() => {
    const handleParticipantJoined = (join: ParticipantJoined) => {
      if (!join.participant) return;
      const { user } = join.participant;
      if (user && !inCallParticipants.includes(user.id)) {
        setInCallParticipants((ps) => [...ps, user.id]);
      }
    };
    // @ts-ignore
    return client?.on('participantJoined', handleParticipantJoined);
  }, [client, inCallParticipants]);

  return (
    <>
      <List
        subheader={<ListSubheader component="div">Participants</ListSubheader>}
      >
        {Object.entries(participants).map(([name, token]) => {
          const isInCall = inCallParticipants.includes(name);
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
                    <Avatar>
                      {isInCall ? (
                        <CallAccept fontSize="small" />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </Avatar>
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
        onClick={() => initiateCall('random-id-' + Date.now())}
      >
        Call
      </Button>
    </>
  );
};
