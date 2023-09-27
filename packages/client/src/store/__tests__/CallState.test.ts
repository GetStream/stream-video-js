import { describe, expect, it } from 'vitest';
import { anyNumber } from 'vitest-mock-extended';
import { StreamVideoParticipant, VisibilityState } from '../../types';
import { CallState } from '../CallState';
import { ConnectionQuality } from '../../gen/video/sfu/models/models';
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
  // TODO OL add API verification test -> observable$ should have a getter!

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
      expect(ps2.map((p) => p.name)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
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
        state.setParticipants([
          {
            userId: 'test',
            name: 'test',
            sessionId: 'test',
            isDominantSpeaker: false,
            isSpeaking: false,
            audioLevel: 0,
            image: '',
            publishedTracks: [],
            connectionQuality: ConnectionQuality.EXCELLENT,
            roles: [],
            trackLookupPrefix: '',
            isLocalParticipant: true,
          },
        ]);

        state.updateFromEvent({
          type: 'call.permissions_updated',
          created_at: '',
          call_cid: 'development:12345',
          own_capabilities: [
            OwnCapability.SEND_AUDIO,
            OwnCapability.SEND_VIDEO,
          ],
          user: {
            id: 'test',
            created_at: '',
            role: '',
            updated_at: '',
            custom: {},
            teams: [],
          },
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
          user: {
            id: 'test',
            created_at: '',
            role: '',
            updated_at: '',
            custom: {},
            teams: [],
          },
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
          // @ts-ignore
          members: [{ user_id: 'user1' }, { user_id: 'user2' }],
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
    });

    describe('call.session events', () => {
      it('should update the call metadata when a session starts', () => {
        const state = new CallState();
        state.updateFromEvent({
          type: 'call.session_started',
          // @ts-ignore
          call: { session: { id: 'session-id' } },
        });

        expect(state.session).toEqual({ id: 'session-id' });
      });

      it('should update the call metadata when a session ends', () => {
        const state = new CallState();
        state.updateFromEvent({
          type: 'call.session_ended',
          // @ts-ignore
          call: { session: { id: 'session-id' } },
        });
        expect(state.session).toEqual({ id: 'session-id' });
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
    });
  });
});
