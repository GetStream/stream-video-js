import '../../rtc/__tests__/mocks/webrtc.mocks';
import { describe, expect, it, vi } from 'vitest';
import { anyNumber } from 'vitest-mock-extended';
import { StreamVideoParticipant, VisibilityState } from '../../types';
import { CallingState } from '../CallingState';
import { CallState } from '../CallState';
import { TrackType } from '../../gen/video/sfu/models/models';
import {
  combineComparators,
  conditional,
  descending,
  dominantSpeaker,
  name,
  noopComparator,
  publishingAudio,
  publishingVideo,
  screenSharing,
} from '../../sorting';
import {
  CallAcceptedEvent,
  CallEndedEvent,
  CallUpdatedEvent,
  MemberResponse,
  OwnCapability,
} from '../../gen/coordinator';
import * as TestData from '../../sorting/__tests__/participant-data';

describe('CallState', () => {
  describe('API assertions', () => {
    it('every exposed observable$ should have a getter', () => {
      const state = new CallState();
      const observables = Object.keys(
        Object.getOwnPropertyDescriptors(state),
      ).filter((key) => key.endsWith('$'));

      // @ts-ignore - __proto__
      const getters = Object.getOwnPropertyDescriptors(state.__proto__);

      for (const observable of observables) {
        const key = observable.slice(0, -1); // remove $
        const getter = getters[key];
        expect(
          getter,
          `A getter for ${observable} is missing. Please define it like this:
          get ${key}() {
            return this.getCurrentValue(this.${observable});
          }
          `,
        ).toBeDefined();
        expect(typeof getter.get).toEqual('function');
      }
    });
  });

  describe('distinctUntilChanged', () => {
    it(`shouldn't emit when primitive (backstage) values didn't change`, () => {
      const state = new CallState();
      const updateWith = (value: boolean) => {
        // @ts-expect-error incomplete data
        state.updateFromCallResponse({ backstage: value });
      };

      updateWith(false);

      const subscriber = vi.fn();
      const subscription = state.backstage$.subscribe(subscriber);

      expect(subscriber).toBeCalledTimes(1); // initial

      updateWith(false);
      updateWith(false);
      expect(subscriber).toBeCalledTimes(1); // still initial

      updateWith(true);
      expect(subscriber).toBeCalledTimes(2); // false -> true

      updateWith(true);
      expect(subscriber).toBeCalledTimes(2); // true -> true

      updateWith(false);
      expect(subscriber).toBeCalledTimes(3); // true -> false
      subscription.unsubscribe();
    });

    it(`shouldn't emit when primitive arrays (ownCapabilities) values didn't change`, () => {
      const state = new CallState();
      state.setOwnCapabilities([OwnCapability.SEND_AUDIO]);

      const subscriber = vi.fn();
      const subscription = state.ownCapabilities$.subscribe(subscriber);

      expect(subscriber).toBeCalledTimes(1); // initial
      state.setOwnCapabilities([OwnCapability.SEND_AUDIO]);
      state.setOwnCapabilities([OwnCapability.SEND_AUDIO]);
      expect(subscriber).toBeCalledTimes(1); // initial

      state.setOwnCapabilities([
        OwnCapability.SEND_AUDIO,
        OwnCapability.SEND_VIDEO,
      ]);
      expect(subscriber).toBeCalledTimes(2); // AUDIO, VIDEO

      state.setOwnCapabilities([
        OwnCapability.SEND_VIDEO,
        OwnCapability.SEND_AUDIO,
      ]);
      expect(subscriber).toBeCalledTimes(2); // VIDEO, AUDIO (order changed)

      state.setOwnCapabilities([OwnCapability.SEND_VIDEO]);
      expect(subscriber).toBeCalledTimes(3); // VIDEO
      subscription.unsubscribe();
    });

    it(`shouldn't emit when enums (callingState) value didn't change`, () => {
      const state = new CallState();

      const subscriber = vi.fn();
      const subscription = state.callingState$.subscribe(subscriber);

      state.setCallingState(CallingState.JOINING);
      expect(subscriber).toBeCalledTimes(2);

      state.setCallingState(CallingState.JOINING);
      state.setCallingState(CallingState.JOINING);
      expect(subscriber).toBeCalledTimes(2);

      state.setCallingState(CallingState.JOINED);
      expect(subscriber).toBeCalledTimes(3);

      state.setCallingState(CallingState.JOINED);
      expect(subscriber).toBeCalledTimes(3);

      state.setCallingState(CallingState.LEFT);
      expect(subscriber).toBeCalledTimes(4);
      subscription.unsubscribe();
    });

    it(`shouldn't emit when string arrays (blockedUserIds) value didn't change`, () => {
      const state = new CallState();
      const updateWith = (value: string[]) => {
        // @ts-expect-error incomplete data
        state.updateFromCallResponse({ blocked_user_ids: value });
      };

      updateWith(['a', 'b']);

      const subscriber = vi.fn();
      const subscription = state.blockedUserIds$.subscribe(subscriber);
      expect(subscriber).toBeCalledTimes(1);

      updateWith(['a', 'b', 'b']);
      expect(subscriber).toBeCalledTimes(2);

      updateWith(['a', 'b', 'c']);
      expect(subscriber).toBeCalledTimes(3);

      updateWith(['a', 'b']);
      expect(subscriber).toBeCalledTimes(4);

      updateWith(['a', 'b', 'c']);
      expect(subscriber).toBeCalledTimes(5);

      updateWith(['b', 'c', 'a']);
      expect(subscriber).toBeCalledTimes(5);

      subscription.unsubscribe();
    });
  });

  describe('updateOrAddParticipant', () => {
    it('updates an existing participant if session_id matches', () => {
      const state = new CallState();
      // @ts-expect-error - incomplete data
      state.setParticipants([{ sessionId: '123', userId: 'alice' }]);

      // @ts-expect-error - incomplete data
      state.updateOrAddParticipant('123', { userId: 'bob' });
      const lookupBySessionId = state.getParticipantLookupBySessionId();
      expect(lookupBySessionId['123']?.userId).toEqual('bob');
    });

    it('appends the participant to the participants array if the session_id is unknown', () => {
      const state = new CallState();
      state.setSortParticipantsBy(noopComparator());
      // @ts-expect-error - incomplete data
      state.setParticipants([{ sessionId: '123', userId: 'alice' }]);

      // @ts-expect-error - incomplete data
      state.updateOrAddParticipant('12345', { userId: 'bob' });
      expect(state.participants.length).toBe(2);
      expect(state.participants[0].userId).toBe('alice');
      expect(state.participants[1].userId).toBe('bob');
    });
  });

  describe('updateParticipants', () => {
    it('does nothing when the patch is empty', () => {
      const state = new CallState();
      // @ts-expect-error - incomplete data
      state.setParticipants([{ sessionId: '123', userId: 'alice' }]);

      const p1Ref = state.participants;
      state.updateParticipants({});
      const p2Ref = state.participants;
      expect(p1Ref === p2Ref).toBeTruthy();
    });

    it('applies participant patches', () => {
      const state = new CallState();
      state.setSortParticipantsBy(noopComparator());
      state.setParticipants([
        // @ts-expect-error - incomplete data
        { sessionId: '123', userId: 'alice' },
        // @ts-expect-error - incomplete data
        { sessionId: '1234', userId: 'charlie ' },
      ]);

      const p1Ref = state.participants;
      state.updateParticipants({ '123': { userId: 'bob' } });
      const p2Ref = state.participants;
      expect(p1Ref === p2Ref).toBeFalsy();
      expect(p1Ref[0].userId).toBe('alice');
      expect(p2Ref[0].userId).toBe('bob');
    });
  });

  describe('sorting', () => {
    it('should emit sorted participants', () => {
      const state = new CallState();
      state.setSortParticipantsBy(noopComparator());
      state.setParticipants(TestData.participants());

      // initial sort criteria
      const ps = state.participants;
      expect(ps.map((p) => p.name)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);

      // update sort criteria
      state.setSortParticipantsBy(
        combineComparators(
          dominantSpeaker,
          publishingAudio,
          publishingVideo,
          screenSharing,
        ),
      );

      const ps2 = state.participants;
      expect(ps2.map((p) => p.name)).toEqual(['D', 'B', 'A', 'F', 'E', 'C']);
    });

    it('should be able to disable sorting', () => {
      const participants = TestData.participants();
      const state = new CallState();
      state.setParticipants(TestData.participants());
      // initial sort criteria
      const ps = state.participants;
      expect(ps.map((p) => p.name)).toEqual(['F', 'B', 'E', 'A', 'C', 'D']);

      // disable sorting
      state.setSortParticipantsBy(noopComparator());

      // update the dominant speaker -> in this case, no sorting should be applied
      const [A] = participants;
      state.updateParticipant(A.sessionId, {
        isDominantSpeaker: true,
      });

      const ps2 = state.participants;
      // should resolve in initial - non-mutated state as set at the beginning
      expect(ps2.map((p) => p.name)).toEqual(['F', 'B', 'E', 'A', 'C', 'D']);
    });

    it('should support custom sorting', () => {
      const state = new CallState();
      state.setSortParticipantsBy(descending(name));

      state.setParticipants(TestData.participants());
      const ps = state.participants;
      expect(ps.map((p) => p.name)).toEqual(['F', 'E', 'D', 'C', 'B', 'A']);
    });

    it('should consider participant visibility', () => {
      const [A, B, C, D] = TestData.participants();

      const state = new CallState();
      state.setSortParticipantsBy(name);
      state.setParticipants([A, B, C, D]);
      expect(state.participants).toEqual([A, B, C, D]);

      const Z = {
        ...A,
        name: 'Z',
      };

      // normal mode: Z is pushed to the end
      state.setParticipants([Z, B, C, D]);
      expect(state.participants).toEqual([B, C, D, Z]);

      const ifInvisibleBy = conditional(
        (a: StreamVideoParticipant, b: StreamVideoParticipant) =>
          a.viewportVisibilityState?.videoTrack === VisibilityState.INVISIBLE ||
          b.viewportVisibilityState?.videoTrack === VisibilityState.INVISIBLE,
      );
      state.setSortParticipantsBy(ifInvisibleBy(name));

      // Z is visible, so it is kept in the same position
      state.setParticipants([Z, B, C, D]);
      expect(state.participants).toEqual([Z, B, C, D]);

      // Z is invisible, so, the normal sorting is applied and Z is pushed to the end
      Z.viewportVisibilityState!.videoTrack = VisibilityState.INVISIBLE;
      state.setParticipants([Z, B, C, D]);
      expect(state.participants).toEqual([B, C, D, Z]);
    });
  });

  describe('pinning', () => {
    it('should update the pinned state of participants in the call', () => {
      const state = new CallState();
      state.setSortParticipantsBy(noopComparator());
      // @ts-ignore
      state.setParticipants([{ sessionId: '123' }, { sessionId: '456' }]);

      state.setServerSidePins([{ sessionId: '123', userId: 'user-id' }]);

      expect(state.participants).toEqual([
        { sessionId: '123', pin: { isLocalPin: false, pinnedAt: anyNumber() } },
        { sessionId: '456' },
      ]);
    });

    it('should unpin participants that are no longer pinned', () => {
      const state = new CallState();
      state.setSortParticipantsBy(noopComparator());
      state.setParticipants([
        // @ts-ignore
        { sessionId: '123', pin: { isLocalPin: false, pinnedAt: 1000 } },
        // @ts-ignore
        { sessionId: '456' },
      ]);

      state.setServerSidePins([]);

      expect(state.participants).toEqual([
        { sessionId: '123', pin: undefined },
        { sessionId: '456' },
      ]);
    });

    it('should not unpin participants that are pinned locally', () => {
      const state = new CallState();
      state.setSortParticipantsBy(noopComparator());
      state.setParticipants([
        // @ts-ignore
        { sessionId: '123', pin: { isLocalPin: true, pinnedAt: 1000 } },
        // @ts-ignore
        { sessionId: '456' },
      ]);

      state.setServerSidePins([]);

      expect(state.participants).toEqual([
        { sessionId: '123', pin: { isLocalPin: true, pinnedAt: 1000 } },
        { sessionId: '456' },
      ]);
    });
  });

  describe('events', () => {
    describe('call.live and backstage events', () => {
      it('handles call.live_started events', () => {
        const state = new CallState();
        // @ts-ignore
        state.updateFromEvent({
          type: 'call.live_started',
          // @ts-ignore
          call: {
            backstage: false,
          },
        });
        expect(state.backstage).toBe(false);
      });
    });

    describe('Call ringing events', () => {
      describe('call.updated', () => {
        it(`will update the call's metadata`, () => {
          const state = new CallState();
          const event: CallUpdatedEvent = {
            type: 'call.updated',
            call_cid: 'development:12345',
            // @ts-expect-error
            call: {
              cid: 'development:12345',
              custom: {
                test: 'value',
              },
            },
          };

          // @ts-ignore
          state.updateFromEvent(event);
          expect(state.custom).toEqual(event.call.custom);
        });
      });

      describe(`call.accepted`, () => {
        it(`will update state`, () => {
          const state = new CallState();
          const event: CallAcceptedEvent = {
            type: 'call.accepted',
            // @ts-expect-error
            call: {
              custom: {
                test: 'value',
              },
            },
          };
          // @ts-ignore
          state.updateFromEvent(event);

          expect(state.custom).toEqual(event.call.custom);
        });
      });

      describe(`call.rejected`, () => {
        it(`will update state`, () => {
          const state = new CallState();
          const event: CallEndedEvent = {
            type: 'call.rejected',
            // @ts-expect-error
            call: {
              custom: {
                test: 'value',
              },
            },
          };
          // @ts-ignore
          state.updateFromEvent(event);

          expect(state.custom).toEqual(event.call.custom);
        });
      });

      describe(`call.ended`, () => {
        it(`will update state`, () => {
          const state = new CallState();
          const event: CallEndedEvent = {
            type: 'call.ended',
            // @ts-expect-error
            call: {
              custom: {
                test: 'value',
              },
            },
          };
          // @ts-ignore
          state.updateFromEvent(event);

          expect(state.custom).toEqual(event.call.custom);
        });
      });
    });

    describe('Call Permission Events', () => {
      it('handles call.permissions_updated', () => {
        const state = new CallState();
        // @ts-expect-error incomplete data
        state.setParticipants([{ userId: 'test', isLocalParticipant: true }]);

        state.updateFromEvent({
          type: 'call.permissions_updated',
          own_capabilities: [
            OwnCapability.SEND_AUDIO,
            OwnCapability.SEND_VIDEO,
          ],
          // @ts-expect-error incomplete data
          user: { id: 'test' },
        });

        expect(state.ownCapabilities).toEqual([
          OwnCapability.SEND_AUDIO,
          OwnCapability.SEND_VIDEO,
        ]);

        state.updateFromEvent({
          type: 'call.permissions_updated',
          created_at: '',
          call_cid: 'development:12345',
          own_capabilities: [OwnCapability.SEND_VIDEO],
          // @ts-expect-error incomplete data
          user: { id: 'test' },
        });
        expect(state.ownCapabilities).toEqual([OwnCapability.SEND_VIDEO]);
      });
    });

    describe('member events', () => {
      it('handles call.member_added events', () => {
        const state = new CallState();
        const initialMembers: MemberResponse[] = [
          {
            user_id: 'user0',
          } as MemberResponse,
        ];
        state.setMembers(initialMembers);
        state.updateFromEvent({
          type: 'call.member_added',
          // @ts-expect-error incomplete data
          members: [{ user_id: 'user1' }, { user_id: 'user2' }],
          // @ts-expect-error incomplete data
          call: {},
        });

        const updatedMembers = state.members;
        updatedMembers.forEach((member, index) =>
          expect(member.user_id).toBe(`user${index}`),
        );
      });

      it('handles call.member_removed events', () => {
        const state = new CallState();
        const initialMembers: MemberResponse[] = [
          // @ts-ignore
          { user_id: 'user0' },
          // @ts-ignore
          { user_id: 'user1' },
          // @ts-ignore
          { user_id: 'user2' },
        ];
        state.setMembers(initialMembers);
        const removedMembers = ['user1'];
        // @ts-ignore
        state.updateFromEvent({
          type: 'call.member_removed',
          members: removedMembers,
          // @ts-expect-error incomplete data
          call: {},
        });

        const updatedMembers = state.members;
        expect(updatedMembers[0].user_id).toBe('user0');
        expect(updatedMembers[1].user_id).toBe('user2');
        expect(updatedMembers.length).toBe(
          initialMembers.length - removedMembers.length,
        );
      });

      it('handles call.member_updated_permission events', () => {
        const state = new CallState();
        const user0 = {
          user_id: 'user0',
          user: {
            role: 'viewer',
          },
        } as MemberResponse;
        const user1 = {
          user_id: 'user1',
          user: {
            role: 'host',
          },
        } as MemberResponse;
        const user2 = {
          user_id: 'user2',
          user: {
            role: 'viewer',
          },
        } as MemberResponse;
        const initialMembers: MemberResponse[] = [user0, user1, user2];
        state.setMembers(initialMembers);
        // @ts-ignore
        state.updateFromEvent({
          type: 'call.member_updated_permission',
          members: [
            {
              user_id: user1.user_id,
              // @ts-ignore
              user: { ...user1, role: 'viewer' },
              role: 'viewer',
            },
            {
              user_id: user0.user_id,
              // @ts-ignore
              user: { ...user0, role: 'host' },
              role: 'host',
            },
          ],
          // @ts-expect-error incomplete data
          call: {},
        });

        const updatedMembers = state.members;
        expect(updatedMembers[0].user.role).toBe('host');
        expect(updatedMembers[1].user.role).toBe('viewer');
        expect(updatedMembers[2].user.role).toBe('viewer');
      });

      it('handles call.member_updated events', () => {
        const state = new CallState();
        const user0 = {
          user_id: 'user0',
          user: {
            name: 'Jane',
          },
        } as MemberResponse;
        const user1 = {
          user_id: 'user1',
          user: {
            name: 'Jack',
          },
        } as MemberResponse;
        const user2 = {
          user_id: 'user2',
          user: {
            name: 'Adam',
          },
        } as MemberResponse;
        const initialMembers: MemberResponse[] = [user0, user1, user2];
        state.setMembers(initialMembers);
        state.updateFromEvent({
          type: 'call.member_updated',
          // @ts-ignore
          members: [{ ...user1, user: { name: 'John' } }],
          // @ts-expect-error incomplete data
          call: {},
        });

        const updatedMembers = state.members;
        expect(updatedMembers[0].user.name).toBe('Jane');
        expect(updatedMembers[1].user.name).toBe('John');
        expect(updatedMembers[2].user.name).toBe('Adam');
      });
    });

    describe('recording and broadcasting events', () => {
      it('handles call.recording_started events', () => {
        const state = new CallState();
        // @ts-ignore
        state.updateFromEvent({
          type: 'call.recording_started',
        });
        expect(state.recording).toBe(true);
      });

      it('handles call.recording_stopped events', () => {
        const state = new CallState();
        // @ts-ignore
        state.updateFromEvent({
          type: 'call.recording_stopped',
        });
        expect(state.recording).toBe(false);
      });

      it('handles call.recording_failed events', () => {
        const state = new CallState();
        // @ts-expect-error incomplete data
        state.updateFromEvent({ type: 'call.recording_started' });
        expect(state.recording).toBe(true);
        // @ts-expect-error incomplete data
        state.updateFromEvent({ type: 'call.recording_failed' });
        expect(state.recording).toBe(false);
      });

      it('handles call.hls_broadcasting_started events', () => {
        const state = new CallState();
        state.updateFromCallResponse({
          // @ts-ignore
          egress: {
            broadcasting: false,
            hls: {
              playlist_url: '',
            },
          },
        });
        // @ts-ignore
        state.updateFromEvent({
          type: 'call.hls_broadcasting_started',
          hls_playlist_url: 'https://example.com/playlist.m3u8',
        });
        expect(state.egress?.broadcasting).toBe(true);
        expect(state.egress?.hls?.playlist_url).toBe(
          'https://example.com/playlist.m3u8',
        );
      });

      it('handles call.hls_broadcasting_stopped events', () => {
        const state = new CallState();
        // @ts-ignore
        state.updateFromCallResponse({});
        // @ts-ignore
        state.updateFromEvent({
          type: 'call.hls_broadcasting_stopped',
        });
        expect(state.egress?.broadcasting).toBe(false);
      });

      it('handles call.hls_broadcasting_failed events', () => {
        const state = new CallState();
        // @ts-expect-error incomplete data
        state.updateFromCallResponse({ egress: { broadcasting: true } });
        // @ts-expect-error incomplete data
        state.updateFromEvent({ type: 'call.hls_broadcasting_failed' });
        expect(state.egress?.broadcasting).toBe(false);
      });
    });

    describe('call.session events', () => {
      it('should update the call metadata when a session starts', () => {
        const state = new CallState();
        state.updateFromEvent({
          type: 'call.session_started',
          call: {
            // @ts-ignore
            session: {
              id: 'session-id',
              participants: [],
              participants_count_by_role: {},
            },
          },
        });

        expect(state.session).toEqual({
          id: 'session-id',
          participants: [],
          participants_count_by_role: {},
        });
      });

      it('should update the call metadata when a session ends', () => {
        const state = new CallState();
        state.updateFromEvent({
          type: 'call.session_ended',
          call: {
            // @ts-ignore
            session: {
              id: 'session-id',
              participants: [],
              participants_count_by_role: {},
            },
          },
        });
        expect(state.session).toEqual({
          id: 'session-id',
          participants: [],
          participants_count_by_role: {},
        });
      });

      it('should update the call metadata when a participant joins', () => {
        const state = new CallState();
        state.updateFromCallResponse({
          // @ts-ignore
          session: {
            participants: [],
            participants_count_by_role: {},
          },
        });
        state.updateFromEvent({
          type: 'call.session_participant_joined',
          participant: {
            // @ts-ignore
            user: {
              id: 'user-id',
              role: 'user',
            },
            user_session_id: '123',
          },
        });
        expect(state.session).toEqual({
          participants: [
            {
              user: {
                id: 'user-id',
                role: 'user',
              },
              user_session_id: '123',
            },
          ],
          participants_count_by_role: {
            user: 1,
          },
        });
      });

      it('should update the call metadata when a participant leaves', () => {
        const state = new CallState();
        state.updateFromCallResponse({
          // @ts-ignore
          session: {
            participants: [
              {
                joined_at: '2021-01-01T00:00:00.000Z',
                // @ts-ignore
                user: {
                  id: 'user-id',
                  role: 'user',
                },
                user_session_id: '123',
              },
            ],
            participants_count_by_role: {
              user: 1,
            },
          },
        });
        state.updateFromEvent({
          type: 'call.session_participant_left',
          participant: {
            // @ts-ignore
            user: {
              id: 'user-id',
              role: 'user',
            },
            user_session_id: '123',
          },
        });
        expect(state.session).toEqual({
          participants: [],
          participants_count_by_role: {
            user: 0,
          },
        });
      });

      it('should update existing participant', () => {
        const state = new CallState();
        state.updateFromCallResponse({
          // @ts-ignore
          session: {
            participants: [
              {
                // @ts-ignore
                user: {
                  id: 'user-id',
                  role: 'user',
                },
                user_session_id: '123',
              },
            ],
            participants_count_by_role: {
              user: 1,
            },
          },
        });
        state.updateFromEvent({
          type: 'call.session_participant_joined',
          participant: {
            // @ts-ignore
            user: {
              id: 'user-id',
              role: 'user',
              name: 'Updated user',
            },
            user_session_id: '123',
          },
        });
        expect(state.session).toEqual({
          participants: [
            {
              // @ts-ignore
              user: {
                id: 'user-id',
                role: 'user',
                name: 'Updated user',
              },
              user_session_id: '123',
            },
          ],
          participants_count_by_role: {
            user: 1,
          },
        });
      });

      it('should handle call.session_participant_updated events', () => {
        const state = new CallState();
        state.updateFromCallResponse({
          // @ts-expect-error incomplete data
          session: { participants: [], participants_count_by_role: {} },
        });
        // @ts-expect-error incomplete data
        state.updateFromEvent({
          type: 'call.session_participant_count_updated',
          anonymous_participant_count: 10,
          participants_count_by_role: { user: 5, host: 3, admin: 1 },
        });

        expect(state.session?.anonymous_participant_count).toBe(10);
        expect(state.session?.participants_count_by_role).toEqual({
          user: 5,
          host: 3,
          admin: 1,
        });
        expect(state.participantCount).toBe(9);
        expect(state.anonymousParticipantCount).toBe(10);
      });

      it('should not update the participant counts when call is joined', () => {
        const state = new CallState();
        state.updateFromCallResponse({
          // @ts-expect-error incomplete data
          session: { participants: [], participants_count_by_role: {} },
        });
        state.setCallingState(CallingState.JOINED);

        // @ts-expect-error incomplete data
        state.updateFromEvent({
          type: 'call.session_participant_count_updated',
          anonymous_participant_count: 10,
          participants_count_by_role: { user: 5, host: 3, admin: 1 },
        });

        expect(state.session?.anonymous_participant_count).toBe(10);
        expect(state.session?.participants_count_by_role).toEqual({
          user: 5,
          host: 3,
          admin: 1,
        });
        expect(state.participantCount).toBe(0);
        expect(state.anonymousParticipantCount).toBe(0);

        // simulate SFU heartbeat
        state.setParticipantCount(3);
        state.setAnonymousParticipantCount(2);
        expect(state.participantCount).toBe(3);
        expect(state.anonymousParticipantCount).toBe(2);
      });
    });
  });

  describe('orphaned tracks', () => {
    it('registers orphaned tracks', () => {
      const state = new CallState();
      state.registerOrphanedTrack({
        id: '123:TRACK_TYPE_VIDEO',
        track: new MediaStream(),
        trackLookupPrefix: '123',
        trackType: TrackType.AUDIO,
      });
      expect(state['orphanedTracks'].length).toBe(1);
    });

    it('removes orphaned tracks once assigned', () => {
      const state = new CallState();
      state.registerOrphanedTrack({
        id: '123:TRACK_TYPE_VIDEO',
        track: new MediaStream(),
        trackLookupPrefix: '123',
        trackType: TrackType.VIDEO,
      });
      const orphans = state.takeOrphanedTracks('123');
      expect(orphans.length).toBe(1);
      expect(state['orphanedTracks'].length).toBe(0);
    });

    it('removes orphaned tracks', () => {
      const state = new CallState();
      const id = '123:TRACK_TYPE_VIDEO';
      state.registerOrphanedTrack({
        id,
        track: new MediaStream(),
        trackLookupPrefix: '123',
        trackType: TrackType.VIDEO,
      });
      expect(state['orphanedTracks'].length).toBe(1);
      state.removeOrphanedTrack(id);
      expect(state['orphanedTracks'].length).toBe(0);
    });
  });
});
