import CallAccept from '@mui/icons-material/Call';
import MicOff from '@mui/icons-material/MicOff';
import VideoCall from '@mui/icons-material/VideoCall';
import CameraOff from '@mui/icons-material/VideocamOff';
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
import {
  AudioMuted,
  AudioUnmuted,
  CallState,
  ParticipantJoined,
  VideoStarted,
  VideoStopped,
} from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-components-react';
import React, { useCallback, useEffect, useState } from 'react';
import type { Participants } from '../App';

export const CreateCall = (props: {
  participants: Participants;
  currentCallState?: CallState;
  currentUser: string;
}) => {
  const { participants, currentUser, currentCallState } = props;
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    Object.keys(participants),
  );

  const [inCallParticipants, setInCallParticipants] = useState<string[]>([]);
  const [audioMuteParticipants, setAudioMuteParticipants] = useState<string[]>(
    [],
  );
  const [videoMuteParticipants, setVideoMuteParticipants] = useState<string[]>(
    [],
  );

  useEffect(() => {
    const inCall: string[] = [];
    const audioMute: string[] = [];
    const videoMute: string[] = [];
    if (currentCallState) {
      currentCallState.participants.forEach((p) => {
        const userId = p.user?.id;
        if (userId && p.online) {
          inCall.push(userId);
          // TODO OL: enable once we can send the initial participant state to the controller server
          // !p.audio && audioMute.push(userId);
          // !p.video && videoMute.push(userId);
        }
      });
    }
    setInCallParticipants(inCall);
    setAudioMuteParticipants(audioMute);
    setVideoMuteParticipants(videoMute);
  }, [currentCallState]);

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
        await client?.createRoom({
          id,
          type: 'my-room-type',
          // participantIds: selectedParticipants,
        });
      } catch (err) {
        console.error(`Failed to create a call`, err);
      }
    },
    [client],
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

  useEffect(() => {
    const handleMute = (e: AudioMuted) => {
      // TODO: Handle MuteAll users
      // @ts-ignore
      const userId = e.target?.userId;
      if (!audioMuteParticipants.includes(userId)) {
        setAudioMuteParticipants((ps) => [...ps, userId]);
      }
    };

    const handleUnmute = (e: AudioUnmuted) => {
      const { userId } = e;
      setAudioMuteParticipants((ps) => ps.filter((id) => id !== userId));
    };

    client?.on('audioMuted', handleMute);
    client?.on('audioUnmuted', handleUnmute);
    return () => {
      client?.off('audioMuted', handleMute);
      client?.off('audioUnmuted', handleUnmute);
    };
  }, [client, audioMuteParticipants]);

  useEffect(() => {
    const handleVideoStopped = (e: VideoStarted) => {
      const { userId } = e;
      if (!videoMuteParticipants.includes(userId)) {
        setVideoMuteParticipants((ps) => [...ps, userId]);
      }
    };
    const handleVideoStarted = (e: VideoStopped) => {
      const { userId } = e;
      setVideoMuteParticipants((ps) => ps.filter((id) => id !== userId));
    };

    client?.on('videoStopped', handleVideoStopped);
    client?.on('videoStarted', handleVideoStarted);
    return () => {
      client?.off('videoStopped', handleVideoStopped);
      client?.off('videoStarted', handleVideoStarted);
    };
  }, [client, videoMuteParticipants]);

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
                  {audioMuteParticipants.includes(name) && (
                    <MicOff fontSize="medium" />
                  )}
                  {videoMuteParticipants.includes(name) && (
                    <CameraOff fontSize="medium" />
                  )}
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
        onClick={() => initiateCall('id-' + Date.now())}
      >
        Call
      </Button>
    </>
  );
};
