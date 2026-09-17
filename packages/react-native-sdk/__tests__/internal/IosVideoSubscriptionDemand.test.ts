import {
  type Call,
  CallingState,
  DebounceType,
  SfuModels,
  type StreamVideoParticipant,
} from '@stream-io/video-client';
import { getIosVideoSubscriptionDemand } from '../../src/utils/internal/IosVideoSubscriptionDemand';
import mockParticipant from '../mocks/participant';
import { mockCall } from '../mocks/call';
import { mockClientWithUser } from '../mocks/client';

jest.useFakeTimers();

const remote = (
  sessionId: string,
  publishedTracks = [SfuModels.TrackType.VIDEO],
): StreamVideoParticipant =>
  mockParticipant({ sessionId, publishedTracks, userId: `user-${sessionId}` });

const joinedCall = (participants: StreamVideoParticipant[]): Call => {
  const call = mockCall(mockClientWithUser(), participants);
  call.state.setCallingState(CallingState.JOINED);
  return call;
};

const subscriptionOf = (
  call: Call,
  sessionId: string,
  trackType: SfuModels.TrackType = SfuModels.TrackType.VIDEO,
) =>
  call.trackSubscriptionManager.subscriptions.find(
    (subscription) =>
      subscription.sessionId === sessionId &&
      subscription.trackType === trackType,
  );

describe('IosVideoSubscriptionDemand', () => {
  it('serves every inline view rendering the same track with one subscription', () => {
    const call = joinedCall([remote('remote-1')]);
    const demand = getIosVideoSubscriptionDemand(call);

    const grid = demand.registerInline({
      sessionId: 'remote-1',
      trackType: 'videoTrack',
    });
    const floatingTile = demand.registerInline({
      sessionId: 'remote-1',
      trackType: 'videoTrack',
    });

    grid.update({ dimension: { width: 200, height: 400 }, eligible: true });
    floatingTile.update({
      dimension: { width: 300, height: 100 },
      eligible: true,
    });

    // the subscription has to satisfy the largest demand on each axis
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 300,
      height: 400,
    });

    // releasing one view must not take the demand of the other one with it
    floatingTile.release();
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 200,
      height: 400,
    });

    grid.release();
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 200,
      height: 400,
    });
  });

  it('keeps the native picture in picture bounds while a hidden inline view grows', () => {
    const call = joinedCall([remote('remote-1')]);
    const demand = getIosVideoSubscriptionDemand(call);
    const inline = demand.registerInline({
      sessionId: 'remote-1',
      trackType: 'videoTrack',
    });
    inline.update({ dimension: { width: 390, height: 725 }, eligible: true });

    demand.setPipDimension({ width: 180, height: 240 });
    demand.acquirePip({ sessionId: 'remote-1', trackType: 'videoTrack' });
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 180,
      height: 240,
    });

    // entering picture in picture enlarges the now hidden call layout
    const apply = jest.spyOn(call.trackSubscriptionManager, 'apply');
    inline.update({ dimension: { width: 390, height: 800 }, eligible: true });
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 180,
      height: 240,
    });
    expect(apply).not.toHaveBeenCalled();

    // resizing the native window is honoured immediately
    demand.setPipDimension({ width: 360, height: 480 });
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 360,
      height: 480,
    });
    expect(apply).toHaveBeenLastCalledWith(DebounceType.IMMEDIATE);

    // and stopping it restores the latest inline demand
    demand.releasePip();
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 390,
      height: 800,
    });
  });

  it('keeps the last demand when picture in picture starts before its window is laid out', () => {
    const call = joinedCall([remote('remote-1')]);
    const demand = getIosVideoSubscriptionDemand(call);
    const inline = demand.registerInline({
      sessionId: 'remote-1',
      trackType: 'videoTrack',
    });
    inline.update({ dimension: { width: 390, height: 725 }, eligible: true });

    const apply = jest.spyOn(call.trackSubscriptionManager, 'apply');
    demand.acquirePip({ sessionId: 'remote-1', trackType: 'videoTrack' });
    inline.update({ dimension: { width: 390, height: 800 }, eligible: true });

    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 390,
      height: 725,
    });
    expect(apply).not.toHaveBeenCalled();

    demand.setPipDimension({ width: 180, height: 240 });
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 180,
      height: 240,
    });
  });

  it('waits for actual geometry instead of inventing a demand', () => {
    const call = joinedCall([remote('remote-1')]);
    const demand = getIosVideoSubscriptionDemand(call);
    const apply = jest.spyOn(call.trackSubscriptionManager, 'apply');

    demand.acquirePip({ sessionId: 'remote-1', trackType: 'videoTrack' });
    expect(subscriptionOf(call, 'remote-1')).toBeUndefined();

    // a mounted but not yet laid out view knows no geometry either
    demand
      .registerInline({ sessionId: 'remote-1', trackType: 'videoTrack' })
      .update({ dimension: undefined, eligible: true });
    expect(subscriptionOf(call, 'remote-1')).toBeUndefined();
    expect(apply).not.toHaveBeenCalled();
  });

  it('unsubscribes hidden and unpublished tracks, but not unmeasured ones', () => {
    const call = joinedCall([remote('remote-1')]);
    const demand = getIosVideoSubscriptionDemand(call);
    const inline = demand.registerInline({
      sessionId: 'remote-1',
      trackType: 'videoTrack',
    });
    inline.update({ dimension: { width: 200, height: 200 }, eligible: true });
    expect(subscriptionOf(call, 'remote-1')).toBeDefined();

    const apply = jest.spyOn(call.trackSubscriptionManager, 'apply');

    // the view is still there, it just has not reported a new layout yet
    inline.update({ dimension: undefined, eligible: true });
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 200,
      height: 200,
    });
    expect(apply).not.toHaveBeenCalled();

    inline.update({ dimension: { width: 200, height: 200 }, eligible: false });
    expect(subscriptionOf(call, 'remote-1')).toBeUndefined();
    expect(apply).toHaveBeenCalledWith(DebounceType.MEDIUM);
  });

  it('ignores invalid and duplicate demand', () => {
    const call = joinedCall([remote('remote-1')]);
    const demand = getIosVideoSubscriptionDemand(call);
    const inline = demand.registerInline({
      sessionId: 'remote-1',
      trackType: 'videoTrack',
    });
    inline.update({ dimension: { width: 200, height: 200 }, eligible: true });

    const apply = jest.spyOn(call.trackSubscriptionManager, 'apply');
    inline.update({ dimension: { width: 200, height: 200 }, eligible: true });
    expect(apply).not.toHaveBeenCalled();

    demand.setPipDimension({ width: 0, height: 240 });
    demand.setPipDimension({ width: NaN, height: NaN });
    demand.acquirePip({ sessionId: 'remote-1', trackType: 'videoTrack' });
    demand.acquirePip({ sessionId: 'remote-1', trackType: 'videoTrack' });
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 200,
      height: 200,
    });
    expect(apply).not.toHaveBeenCalled();
  });

  it('keeps the camera and the screen share of a participant apart', () => {
    const call = joinedCall([
      remote('remote-1', [
        SfuModels.TrackType.VIDEO,
        SfuModels.TrackType.SCREEN_SHARE,
      ]),
    ]);
    const demand = getIosVideoSubscriptionDemand(call);
    demand
      .registerInline({ sessionId: 'remote-1', trackType: 'videoTrack' })
      .update({ dimension: { width: 100, height: 100 }, eligible: true });
    demand
      .registerInline({ sessionId: 'remote-1', trackType: 'screenShareTrack' })
      .update({ dimension: { width: 800, height: 600 }, eligible: true });

    demand.setPipDimension({ width: 180, height: 240 });
    demand.acquirePip({ sessionId: 'remote-1', trackType: 'screenShareTrack' });

    expect(
      subscriptionOf(call, 'remote-1', SfuModels.TrackType.SCREEN_SHARE)
        ?.dimension,
    ).toEqual({ width: 180, height: 240 });
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 100,
      height: 100,
    });
  });

  it('leaves the demand of the other participants alone', () => {
    const call = joinedCall([remote('remote-1'), remote('remote-2')]);
    const demand = getIosVideoSubscriptionDemand(call);
    demand
      .registerInline({ sessionId: 'remote-1', trackType: 'videoTrack' })
      .update({ dimension: { width: 390, height: 725 }, eligible: true });
    const other = demand.registerInline({
      sessionId: 'remote-2',
      trackType: 'videoTrack',
    });

    demand.setPipDimension({ width: 180, height: 240 });
    demand.acquirePip({ sessionId: 'remote-1', trackType: 'videoTrack' });
    other.update({ dimension: { width: 160, height: 90 }, eligible: true });

    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 180,
      height: 240,
    });
    expect(subscriptionOf(call, 'remote-2')?.dimension).toEqual({
      width: 160,
      height: 90,
    });
  });

  it('transfers the picture in picture demand to a new selection', () => {
    const call = joinedCall([remote('remote-1'), remote('remote-2')]);
    const demand = getIosVideoSubscriptionDemand(call);
    const first = demand.registerInline({
      sessionId: 'remote-1',
      trackType: 'videoTrack',
    });
    first.update({ dimension: { width: 390, height: 725 }, eligible: true });
    demand.setPipDimension({ width: 180, height: 240 });
    demand.acquirePip({ sessionId: 'remote-1', trackType: 'videoTrack' });

    demand.acquirePip({ sessionId: 'remote-2', trackType: 'videoTrack' });

    // the new selection reuses the current native window bounds, the previous
    // one falls back to its own inline demand
    expect(subscriptionOf(call, 'remote-2')?.dimension).toEqual({
      width: 180,
      height: 240,
    });
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 390,
      height: 725,
    });
  });

  it('keeps two calls with the same cid isolated', () => {
    const client = mockClientWithUser();
    const oldCall = mockCall(client, [remote('remote-1')]);
    const newCall = mockCall(client, [remote('remote-1')]);
    expect(oldCall).not.toBe(newCall);
    expect(oldCall.cid).toBe(newCall.cid);
    oldCall.state.setCallingState(CallingState.JOINED);
    newCall.state.setCallingState(CallingState.JOINED);

    const oldDemand = getIosVideoSubscriptionDemand(oldCall);
    const oldInline = oldDemand.registerInline({
      sessionId: 'remote-1',
      trackType: 'videoTrack',
    });
    oldInline.update({
      dimension: { width: 100, height: 100 },
      eligible: true,
    });
    oldDemand.setPipDimension({ width: 180, height: 240 });
    oldDemand.acquirePip({ sessionId: 'remote-1', trackType: 'videoTrack' });

    const newDemand = getIosVideoSubscriptionDemand(newCall);
    expect(newDemand).not.toBe(oldDemand);
    newDemand
      .registerInline({ sessionId: 'remote-1', trackType: 'videoTrack' })
      .update({ dimension: { width: 390, height: 725 }, eligible: true });

    // closing the old call and its view must not reset the new call
    oldDemand.releasePip();
    oldInline.release();

    expect(subscriptionOf(newCall, 'remote-1')?.dimension).toEqual({
      width: 390,
      height: 725,
    });
  });

  it('applies the demand once the call is joined, and again after a rejoin', () => {
    const call = mockCall(mockClientWithUser(), [remote('remote-1')]);
    const demand = getIosVideoSubscriptionDemand(call);
    demand
      .registerInline({ sessionId: 'remote-1', trackType: 'videoTrack' })
      .update({ dimension: { width: 200, height: 200 }, eligible: true });

    expect(subscriptionOf(call, 'remote-1')).toBeUndefined();

    const apply = jest.spyOn(call.trackSubscriptionManager, 'apply');
    call.state.setCallingState(CallingState.JOINED);
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 200,
      height: 200,
    });
    expect(apply).toHaveBeenCalledTimes(1);

    // the subscriptions have to be sent again after a reconnect, even though
    // no view has moved in the meantime
    call.state.setCallingState(CallingState.RECONNECTING);
    call.state.setCallingState(CallingState.JOINED);
    expect(apply).toHaveBeenCalledTimes(2);
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual({
      width: 200,
      height: 200,
    });
  });

  it('reapplies the demand when the participant appears in the call state', () => {
    const call = joinedCall([]);
    const demand = getIosVideoSubscriptionDemand(call);
    const inline = demand.registerInline({
      sessionId: 'remote-1',
      trackType: 'videoTrack',
    });
    const dimension = { width: 200, height: 200 };
    inline.update({ dimension, eligible: true });
    expect(subscriptionOf(call, 'remote-1')).toBeUndefined();

    // the participant joins, the view reports the geometry it already knows
    call.state.setParticipants([remote('remote-1')]);
    inline.update({ dimension, eligible: true });
    expect(subscriptionOf(call, 'remote-1')?.dimension).toEqual(dimension);
  });
});
