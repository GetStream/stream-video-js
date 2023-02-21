import { useRouter } from 'next/router';
import * as React from 'react';
import { useCallback, useState } from 'react';
import {
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import {
  CallParticipantsList,
  DeviceSettings,
  LoadingIndicator,
  Stage,
} from '@stream-io/video-react-sdk';
import { CallControls } from './CallControls';
import { IconInviteLinkButton, InviteLinkButton } from './InviteLinkButton';
import { GetInviteLinkButton } from '@stream-io/video-react-sdk/dist/src/components/CallParticipantsList/GetInviteLinkButton';
import { CallHeaderTitle } from './CallHeaderTitle';
import { Lobby } from './Lobby';
import { Button, Stack, Typography } from '@mui/material';

const contents = {
  'error-join': {
    heading: 'Failed to join the call',
    buttonText: 'Return home',
  },
  'error-leave': {
    heading: 'Error when disconnecting',
    buttonText: '< Continue home',
  },
};

export const MeetingUI = () => {
  const [show, setShow] = useState<
    'lobby' | 'error-join' | 'error-leave' | 'loading' | 'active-call'
  >('lobby');
  const router = useRouter();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();
  const [showParticipants, setShowParticipants] = useState(false);

  const toggleParticipantList = useCallback(
    () => setShowParticipants((prev) => !prev),
    [],
  );

  const hideParticipantList = useCallback(() => setShowParticipants(false), []);

  const onJoin = useCallback(async () => {
    setShow('loading');
    try {
      await client.joinCall({
        id: callId,
        type: callType,
        // FIXME: OL optional, but it is marked as required in proto
        datacenterId: '',
      });
      setShow('active-call');
    } catch (e) {
      console.error(e);
      setShow('error-join');
    }
  }, [callId, callType, client]);

  const onLeave = useCallback(async () => {
    setShow('loading');
    try {
      await client.cancelCall(`${callType}:${callId}`);
      setShow('lobby');
    } catch (e) {
      console.error(e);
      setShow('error-leave');
    }
  }, [client, callType, callId]);

  if (show.match('error')) {
    return (
      <Stack height={1} justifyContent="center" alignItems="center" gap={5}>
        <div>
          <Typography variant="h2" textAlign="center">
            {contents[show].heading}
          </Typography>
          <Typography variant="subtitle1" textAlign="center">
            (see the console for more info)
          </Typography>
        </div>
        <Stack direction="row" gap={3}>
          <Button
            style={{ width: '200px' }}
            data-testid="return-home-button"
            variant="contained"
            onClick={() => router.push(`/`)}
          >
            {contents[show].buttonText}
          </Button>

          <Button
            style={{ width: '200px' }}
            data-testid="return-home-button"
            variant="contained"
            onClick={() => setShow('lobby')}
          >
            {'Back to lobby >'}
          </Button>
        </Stack>
      </Stack>
    );
  }
  if (show === 'lobby') return <Lobby onJoin={onJoin} />;

  if (show === 'loading')
    return (
      <div className=" str-video str-video__call">
        <div className="str-video__call__loading-screen">
          <LoadingIndicator />
        </div>
      </div>
    );

  const showSidebar = showParticipants;

  return (
    <div className=" str-video str-video__call">
      <div className="str-video__call__main">
        <div className="str-video__call-header">
          <CallHeaderTitle />
          <div className="str-video__call-header__controls-group">
            <GetInviteLinkButton Button={IconInviteLinkButton} />
            <DeviceSettings />
          </div>
        </div>
        <Stage call={activeCall} />
        <CallControls
          call={activeCall}
          onLeave={onLeave}
          participantListEnabled={showParticipants}
          toggleShowParticipantList={toggleParticipantList}
        />
      </div>
      {showSidebar && (
        <div className="str-video__sidebar">
          {showParticipants && (
            <CallParticipantsList
              onClose={hideParticipantList}
              InviteLinkButton={InviteLinkButton}
            />
          )}
        </div>
      )}
    </div>
  );
};
