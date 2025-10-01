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
  withVideoIngressSource,
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

  it('withIngressSource', () => {
    expect(
      withVideoIngressSource(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.WEBRTC_UNSPECIFIED },
        { source: ParticipantSource.SRT },
      ),
    ).toEqual(1);
    expect(
      withVideoIngressSource(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.WEBRTC_UNSPECIFIED },
        { source: ParticipantSource.SIP },
      ),
    ).toEqual(0);
    expect(
      withVideoIngressSource(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.RTMP },
        { source: ParticipantSource.SIP },
      ),
    ).toEqual(-1);
    expect(
      withVideoIngressSource(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.SIP },
        { source: ParticipantSource.RTMP },
      ),
    ).toEqual(1);
    expect(
      withVideoIngressSource(
        // @ts-expect-error incomplete data
        { source: ParticipantSource.WEBRTC_UNSPECIFIED },
        { source: ParticipantSource.RTMP },
      ),
    ).toEqual(1);
  });
});
