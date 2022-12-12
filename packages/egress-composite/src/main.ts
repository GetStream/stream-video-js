import {
  Call,
  StreamVideoClient,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import './style.css';

(async function run() {
  const urlParams = new URLSearchParams(window.location.search);

  // Call parameters
  const callId = urlParams.get('call_id') || 'egress-test';

  // Access and operation mode config
  const localDev = Boolean(urlParams.get('local') || false);
  const mode = urlParams.get('mode') || 'speaker';
  const apiKey = urlParams.get('api_key') || 'key10';
  const accessToken =
    urlParams.get('token') ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tanNAdjAuMC4wIiwic3ViIjoidXNlci9lZ3Jlc3NAZ2V0c3RyZWFtLmlvIiwiaWF0IjoxNjY3NDAwMTgsInVzZXJfaWQiOiJlZ3Jlc3NAZ2V0c3RyZWFtLmlvIn0.bzrr3W2PPjhoN7gee7i-i26DjtcKHfAB9buiKH1LtEc';

  // Environment config
  const coordinatorRpcUrl =
    urlParams.get('coordinator_rpc_url') || localDev
      ? 'http://localhost:26991/rpc/'
      : 'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc';
  const coordinatorWsUrl =
    urlParams.get('coordinator_ws_url') || localDev
      ? 'ws://localhost:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect'
      : 'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect';

  const client = new StreamVideoClient(apiKey, {
    token: accessToken,
    sendJson: true,
    coordinatorRpcUrl,
    coordinatorWsUrl,
  });

  const store$ = client.readOnlyStateStore;

  await client.connect(apiKey, accessToken, {
    id: 'egress',
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
    datacenterId: '',
  });

  if (!call) {
    throw new Error(`Failed to join a call with id: ${callId}`);
  }

  await call.join();
  console.log('Connection is established.');

  store$.dominantSpeaker$.subscribe((dominantSpeaker) => {
    if (dominantSpeaker) {
      call.updateSubscriptionsPartial('video', {
        [dominantSpeaker.sessionId]: {
          dimension: {
            width: 1920,
            height: 1080,
          },
        },
      });
    }
  });

  call.on('participantLeft', (event) => {
    if (event.eventPayload.oneofKind !== 'participantLeft') return;
    const { participant } = event.eventPayload.participantLeft;
    if (participant) {
      const $audioEl = document.getElementById(
        `speaker-${participant.sessionId}`,
      );
      if ($audioEl) {
        const mediaStream = ($audioEl as HTMLAudioElement)
          .srcObject as MediaStream | null;
        mediaStream?.getTracks().forEach((t) => {
          t.stop();
          mediaStream.removeTrack(t);
        });

        $audioEl.remove();
      }
    }
  });

  let shuffleIntervalId: NodeJS.Timeout;
  const highlightSpeaker = createSpeakerUpdater(call);
  store$.activeCallRemoteParticipants$.subscribe((remoteParticipants) => {
    remoteParticipants.forEach(attachAudioTrack);

    console.log('remoteParticipants updated', remoteParticipants);
    if (mode === 'speaker') {
      const [loudestParticipant] = [...remoteParticipants].sort((a, b) => {
        return (b.audioLevel || 0) - (a.audioLevel || 0);
      });

      const speaker = remoteParticipants.find(
        (p) => p.sessionId === loudestParticipant.sessionId,
      );

      highlightSpeaker(speaker);
    } else if (mode === 'shuffle') {
      clearInterval(shuffleIntervalId);
      shuffleIntervalId = setInterval(() => {
        const randomSpeaker =
          remoteParticipants[
            Math.floor(Math.random() * remoteParticipants.length)
          ];

        highlightSpeaker(randomSpeaker);
      }, 3500);
    }
  });
})();

function createSpeakerUpdater(call: Call) {
  const $videoA = document.getElementById('speaker-a') as HTMLVideoElement;
  const $videoB = document.getElementById('speaker-b') as HTMLVideoElement;

  $videoA.addEventListener('canplay', () => {
    void $videoA.play();
  });
  $videoB.addEventListener('canplay', () => {
    void $videoB.play();
  });

  const other = ($current: HTMLVideoElement) =>
    $current === $videoA ? $videoB : $videoA;

  $videoA.addEventListener('playing', () => {
    $videoB.classList.toggle('hidden');
    $videoA.classList.remove('hidden');
  });

  $videoB.addEventListener('playing', () => {
    $videoA.classList.toggle('hidden');
    $videoB.classList.remove('hidden');
  });

  let $currentVideoEl = $videoA;
  let lastSpeaker: StreamVideoParticipant | undefined;
  return function highlightSpeaker(speaker?: StreamVideoParticipant) {
    if (speaker && speaker.sessionId !== lastSpeaker?.sessionId) {
      call.updateSubscriptionsPartial('video', {
        [speaker.sessionId]: {
          dimension: {
            width: 1920,
            height: 1080,
          },
        },
        ...(lastSpeaker && {
          [lastSpeaker.sessionId]: {
            dimension: undefined,
          },
        }),
      });

      console.log(
        `Swapping highlighted speaker`,
        speaker.userId,
        speaker.sessionId,
      );

      $currentVideoEl = other($currentVideoEl);
      // FIXME: use avatar as the speaker might not be always publishing a video track
      $currentVideoEl.srcObject = speaker.videoStream || null;
      $currentVideoEl.title = speaker.userId;

      updateCurrentSpeakerName(speaker);

      lastSpeaker = speaker;
    }
  };
}

function updateCurrentSpeakerName(speaker: StreamVideoParticipant) {
  let $userNameEl = document.getElementById('current-user-name');
  if (!$userNameEl) {
    $userNameEl = document.createElement('span');
    $userNameEl.id = 'current-user-name';

    document.getElementById('app')!.appendChild($userNameEl);
  }

  $userNameEl.innerText = speaker.userId ?? 'N/A';
  $userNameEl.title = speaker.sessionId;
}

function attachAudioTrack(participant: StreamVideoParticipant) {
  const app = document.getElementById('app')!;

  let $audioEl = document.getElementById(
    `speaker-${participant.sessionId}`,
  ) as HTMLAudioElement | null;
  if (!$audioEl) {
    $audioEl = document.createElement('audio') as HTMLAudioElement;
    $audioEl.title = participant.userId;
    $audioEl.id = `speaker-${participant.sessionId}`;
    $audioEl.autoplay = true;
    $audioEl.addEventListener('canplay', () => {
      $audioEl!.play();
    });

    app.appendChild($audioEl);
  }

  const previousAudioTrack = $audioEl.srcObject as MediaStream | null;
  const audioStream = participant.audioStream;
  if (audioStream) {
    if (previousAudioTrack?.id !== audioStream.id) {
      $audioEl.srcObject = audioStream;
    }
  } else {
    $audioEl.srcObject = null;
  }
}
