import { useMemo } from 'react';

export function CapabilitiesDash() {
  return (
    <>
      <div className="rd__inspector-dash">
        <h3 data-copyable data-h>
          Video encoding support
        </h3>
        <CodecCapabilitiesDash direction="send" kind="video" />
      </div>
      <div className="rd__inspector-dash">
        <h3 data-copyable data-h>
          Video decoding support
        </h3>
        <CodecCapabilitiesDash direction="recv" kind="video" />
      </div>
      <div className="rd__inspector-dash">
        <h3 data-copyable data-h>
          Audio encoding support
        </h3>
        <CodecCapabilitiesDash direction="send" kind="audio" />
      </div>
      <div className="rd__inspector-dash">
        <h3 data-copyable data-h>
          Audio decoding support
        </h3>
        <CodecCapabilitiesDash direction="recv" kind="audio" />
      </div>
    </>
  );
}

export function CodecCapabilitiesDash(props: {
  direction: 'send' | 'recv';
  kind: 'video' | 'audio';
}) {
  const videoEncodingCapabilities = useMemo(
    () => getCodecCapabilties(props.direction, props.kind),
    [props.direction, props.kind],
  );

  return (
    <ul>
      {videoEncodingCapabilities.map((capability) => (
        <li key={capability} data-copyable>
          {capability}
        </li>
      ))}
    </ul>
  );
}

const skippedCodecMimeTypes = new Set([
  'video/rtx',
  'video/ulpfec',
  'video/flexfec-03',
  'audio/CN',
  'audio/G722',
  'audio/PCMU',
  'audio/PCMA',
  'audio/telephone-event',
]);

function getCodecCapabilties(
  direction: 'send' | 'recv',
  kind: string,
): string[] {
  const codecs = (
    direction === 'send' ? RTCRtpSender : RTCRtpReceiver
  ).getCapabilities(kind)?.codecs;

  if (!codecs) {
    return [];
  }

  const capabilities = new Set<string>();

  for (const codec of codecs) {
    if (skippedCodecMimeTypes.has(codec.mimeType)) {
      continue;
    }

    const prefix = `${kind}/`;
    const mimeType = codec.mimeType.startsWith(prefix)
      ? codec.mimeType.substring(prefix.length)
      : codec.mimeType;

    if (mimeType === 'red') {
      capabilities.add(`redundant ${kind} data`);
      continue;
    }

    if (codec.sdpFmtpLine) {
      const sdpFmtp = parseSdpFmtpLine(codec.sdpFmtpLine);
      if (codec.mimeType === 'video/H264' && sdpFmtp['profile-level-id']) {
        capabilities.add(
          `${mimeType} ${parseH264ProfileLevelId(sdpFmtp['profile-level-id'])}`,
        );
      } else if (codec.mimeType === 'video/AV1' && sdpFmtp['level-idx']) {
        capabilities.add(
          `${mimeType} ${parseAV1LevelIdx(sdpFmtp['level-idx'])}`,
        );
      } else if (codec.mimeType === 'video/VP9' && sdpFmtp['profile-id']) {
        capabilities.add(
          `${mimeType} ${parseVP9ProfileId(sdpFmtp['profile-id'])}`,
        );
      } else if (codec.mimeType === 'audio/opus') {
        capabilities.add(
          `${mimeType}${sdpFmtp.useinbandfec === '1' ? ' with error correction' : ''}`,
        );
      } else {
        capabilities.add(`${mimeType} ${formatSdpFmtpLine(sdpFmtp)}`);
      }
    } else {
      capabilities.add(mimeType);
    }
  }

  return Array.from(capabilities);
}

function parseSdpFmtpLine(
  sdpFmtpLine: string,
): Record<string, string | undefined> {
  const keyValueStrings = sdpFmtpLine.split(';');
  return Object.fromEntries(
    keyValueStrings.map((keyValueString) => keyValueString.split('=')),
  );
}

function parseH264ProfileLevelId(profileLevelId: string): string {
  if (profileLevelId.length === 6) {
    return `0x${profileLevelId} ${parseH264Profile(profileLevelId)} ${parseH264Level(profileLevelId)}`;
  }

  return `0x${profileLevelId}`;
}

function parseH264Profile(profileLevelId: string): string {
  switch (profileLevelId.substring(0, 2)) {
    case '42':
      return parseInt(profileLevelId.substring(2, 3), 16) >= 9
        ? 'Constrained Baseline'
        : 'Baseline';
    case '4d':
      return 'Mainline';
    case '58':
      return 'Extended';
    case '64':
      return 'High';
    case '6e':
      return 'High 10';
    case 'f4':
      return 'High 4:4:4 Predictive';
  }

  return '-';
}

function parseH264Level(profileLevelId: string): string {
  const level = parseInt(profileLevelId.substring(4, 6), 16);
  return (level / 10).toString();
}

function parseAV1LevelIdx(levelIdx: string): string {
  const levelIdxParsed = parseInt(levelIdx, 10);
  const major = 2 + Math.floor(levelIdxParsed / 4);
  const minor = levelIdxParsed % 4;
  return `level ${major}.${minor}`;
}

function parseVP9ProfileId(profileId: string): string {
  return `profile ${profileId}`;
}

function formatSdpFmtpLine(
  sdpFmtp: Record<string, string | undefined>,
): string {
  return Object.entries(sdpFmtp)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}
