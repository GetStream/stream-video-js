import {
  StreamVideoClient,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import './style.css';

(async function run() {
  const urlParams = new URLSearchParams(window.location.search);

  // Call parameters
  const callId = urlParams.get('call_id') || 'egress-test';

  // Access and operation mode config
  const mode = urlParams.get('mode') || 'speaker';
  const apiKey = urlParams.get('api_key') || 'key10';
  const accessToken =
    urlParams.get('token') ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tanNAdjAuMC4wIiwic3ViIjoidXNlci9lZ3Jlc3NAZ2V0c3RyZWFtLmlvIiwiaWF0IjoxNjY3NDAwMTgsInVzZXJfaWQiOiJlZ3Jlc3NAZ2V0c3RyZWFtLmlvIn0.bzrr3W2PPjhoN7gee7i-i26DjtcKHfAB9buiKH1LtEc';

  // Environment config
  const coordinatorRpcUrl =
    urlParams.get('coordinator_rpc_url') ||
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc';
  const coordinatorWsUrl =
    urlParams.get('coordinator_ws_url') ||
    'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect';

  const client = new StreamVideoClient(apiKey, {
    token: accessToken,
    sendJson: true,
    coordinatorRpcUrl,
    coordinatorWsUrl,
  });

  const store$ = client.readOnlyStateStore;

  await client.connect(apiKey, accessToken, {
    name: 'egress',
    role: 'spectator',
    teams: ['stream-io'],
    imageUrl: '/profile.png',
    customJson: new Uint8Array(),
  });

  console.log('Joining call with id:', callId);
  const call = await client.joinCall({
    id: callId,
    type: 'default',
    datacenterId: 'aws-egress',
  });

  if (!call) {
    throw new Error(`Failed to join a call with id: ${callId}`);
  }

  await call.join();
  console.log('Connection is established.');

  store$.dominantSpeaker$.subscribe((userId) => {
    const participants = store$.getCurrentValue(store$.activeCallParticipants$);
    const dominantSpeaker = participants.find((p) => p.user!.id === userId);
    if (dominantSpeaker) {
      call.updateSubscriptionsPartial({
        [dominantSpeaker.sessionId]: {
          videoDimension: {
            width: 1280,
            height: 720,
          },
        },
      });
    }
  });

  let shuffleIntervalId: NodeJS.Timeout;
  const highlightSpeaker = createSpeakerUpdater();

  store$.activeCallParticipants$.subscribe((participants) => {
    console.log('participants updated', participants);
    if (mode === 'speaker') {
      const [loudestParticipant] = [...participants].sort((a, b) => {
        return (b.audioLevel || 0) - (a.audioLevel || 0);
      });

      const speaker: StreamVideoParticipant | undefined = participants.find(
        (p) => p.user!.id === loudestParticipant.user!.id,
      );

      highlightSpeaker(speaker);
    } else if (mode === 'shuffle') {
      clearInterval(shuffleIntervalId);
      shuffleIntervalId = setInterval(() => {
        const speakers = participants.filter(
          (p) => p.user!.id !== 'egress@getstream.io',
        );

        const randomSpeaker =
          speakers[Math.floor(Math.random() * speakers.length)];
        highlightSpeaker(randomSpeaker);
      }, 3500);
    }
  });
})();

function createSpeakerUpdater() {
  const $audioEl = document.getElementById(
    'current-speaker-audio',
  ) as HTMLAudioElement;
  const $videoEl = document.getElementById(
    'current-speaker-video',
  ) as HTMLVideoElement;

  $audioEl.addEventListener('canplay', () => {
    $audioEl.play();
  });

  $videoEl.addEventListener('canplay', () => {
    $videoEl.play();
  });

  let lastSpeaker: StreamVideoParticipant | undefined;
  return function highlightSpeaker(speaker?: StreamVideoParticipant) {
    if (
      speaker &&
      speaker.sessionId !== lastSpeaker?.sessionId &&
      speaker.videoTrack &&
      speaker.audioTrack
    ) {
      console.log(`Swapping highlighted speaker`, speaker.user!.id);

      // FIXME: use avatar as the speaker might not be always publishing a video track
      $audioEl.srcObject = speaker.audioTrack!;
      $videoEl.srcObject = speaker.videoTrack!;
      $videoEl.title = speaker.user!.id;

      lastSpeaker = speaker;
    }
  };
}
