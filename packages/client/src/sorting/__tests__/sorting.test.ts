import { describe, expect, it } from 'vitest';
import { ParticipantSource } from '../../gen/video/sfu/models/models';
import {
  combineComparators,
  Comparator,
  conditional,
  dominantSpeaker,
  pinned,
  publishingAudio,
  publishingVideo,
  screenSharing,
  withParticipantSource,
} from '../index';
import * as TestData from './participant-data';

describe('Sorting', () => {
  it('presenter, dominant speaker, video, audio, mute', () => {
    const comparator = combineComparators(
      screenSharing,
      dominantSpeaker,
      publishingVideo,
      publishingAudio,
    );
    const sorted = TestData.participants().sort(comparator);
    expect(sorted.map((p) => p.name)).toEqual(['B', 'E', 'D', 'A', 'F', 'C']);
  });

  it('pinned, dominant speaker, audio, video, mute, screenshare', () => {
    const comparator = combineComparators(
      pinned,
      dominantSpeaker,
      publishingAudio,
      publishingVideo,
      screenSharing,
    );
    const sorted = TestData.participants().sort(comparator);
    expect(sorted.map((p) => p.name)).toEqual(['F', 'D', 'B', 'A', 'E', 'C']);
  });

  it('conditional comparator', () => {
    const byValue: Comparator<number> = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    const input = [2, 3, 1];
    expect([...input].sort(byValue)).toEqual([1, 2, 3]);

    const disableComparator = conditional<number>(() => false);
    expect([...input].sort(disableComparator(byValue))).toEqual([2, 3, 1]);
  });

  it('withParticipantSource', () => {
    expect(
      withParticipantSource(ParticipantSource.SRT)(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.WEBRTC_UNSPECIFIED }, // -1
        { source: ParticipantSource.SRT }, // 0
      ),
    ).toEqual(1);
    expect(
      withParticipantSource(ParticipantSource.RTMP)(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.WEBRTC_UNSPECIFIED },
        { source: ParticipantSource.SIP },
      ),
    ).toEqual(0);
    expect(
      withParticipantSource(ParticipantSource.RTMP)(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.RTMP },
        { source: ParticipantSource.SIP },
      ),
    ).toEqual(-1);
    expect(
      withParticipantSource(ParticipantSource.RTMP)(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.SIP },
        { source: ParticipantSource.RTMP },
      ),
    ).toEqual(1);
    expect(
      withParticipantSource(ParticipantSource.RTMP)(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.WEBRTC_UNSPECIFIED },
        { source: ParticipantSource.RTMP },
      ),
    ).toEqual(1);

    expect(
      withParticipantSource(ParticipantSource.SRT, ParticipantSource.RTMP)(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.RTMP },
        { source: ParticipantSource.SRT },
      ),
    ).toEqual(1);

    expect(
      withParticipantSource(ParticipantSource.RTMP, ParticipantSource.SRT)(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.RTMP },
        { source: ParticipantSource.SRT },
      ),
    ).toEqual(-1);
    expect(
      withParticipantSource(ParticipantSource.RTMP, ParticipantSource.SRT)(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.WHIP },
        { source: ParticipantSource.SRT },
      ),
    ).toEqual(1);

    expect(
      withParticipantSource(
        ParticipantSource.WHIP,
        ParticipantSource.RTMP,
        ParticipantSource.SRT,
      )(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.WHIP },
        { source: ParticipantSource.SRT },
      ),
    ).toEqual(-1);
  });

  it('withParticipantSources with multiple participants', () => {
    const participants = [
      { source: ParticipantSource.WEBRTC_UNSPECIFIED },
      { source: ParticipantSource.SRT },
      { source: ParticipantSource.RTMP },
      { source: ParticipantSource.SIP },
      { source: ParticipantSource.RTSP },
      { source: ParticipantSource.WHIP },
    ];

    const sorted = [...participants].sort(
      withParticipantSource(
        ParticipantSource.RTMP,
        ParticipantSource.SRT,
        ParticipantSource.WHIP,
        ParticipantSource.RTSP,
        ParticipantSource.SIP,
        ParticipantSource.WEBRTC_UNSPECIFIED,
      ),
    );

    expect(sorted).toEqual([
      { source: ParticipantSource.RTMP },
      { source: ParticipantSource.SRT },
      { source: ParticipantSource.WHIP },
      { source: ParticipantSource.RTSP },
      { source: ParticipantSource.SIP },
      { source: ParticipantSource.WEBRTC_UNSPECIFIED },
    ]);
  });
});
