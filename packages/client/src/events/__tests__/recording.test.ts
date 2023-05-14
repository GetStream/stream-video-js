import { describe, expect, it } from 'vitest';
import { CallState } from '../../store';
import {
  watchCallBroadcastingStarted,
  watchCallBroadcastingStopped,
  watchCallRecordingStarted,
  watchCallRecordingStopped,
} from '../recording';

describe('recording and broadcasting events', () => {
  it('handles call.recording_started events', () => {
    const state = new CallState();
    const handler = watchCallRecordingStarted(state);
    // @ts-ignore
    handler({
      type: 'call.recording_started',
    });
    expect(state.metadata?.recording).toBe(true);
  });

  it('handles call.recording_stopped events', () => {
    const state = new CallState();
    const handler = watchCallRecordingStopped(state);
    // @ts-ignore
    handler({
      type: 'call.recording_stopped',
    });
    expect(state.metadata?.recording).toBe(false);
  });

  it('handles call.broadcasting_started events', () => {
    const state = new CallState();
    const handler = watchCallBroadcastingStarted(state);
    // @ts-ignore
    handler({
      type: 'call.broadcasting_started',
      hls_playlist_url: 'https://example.com/playlist.m3u8',
    });
    expect(state.metadata?.broadcasting).toBe(true);
    expect(state.metadata?.hls_playlist_url).toBe(
      'https://example.com/playlist.m3u8',
    );
  });

  it('handles call.broadcasting_stopped events', () => {
    const state = new CallState();
    const handler = watchCallBroadcastingStopped(state);
    // @ts-ignore
    handler({
      type: 'call.broadcasting_stopped',
    });
    expect(state.metadata?.broadcasting).toBe(false);
  });
});
