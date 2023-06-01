import { describe, expect, it } from 'vitest';
import { MemberResponse } from '../../gen/coordinator';
import { CallState } from '../../store';
import {
  watchCallMemberAdded,
  watchCallMemberRemoved,
  watchCallMemberUpdated,
  watchCallMemberUpdatedPermission,
} from '../members';
import { StreamVideoEvent } from '../../coordinator/connection/types';

describe('member events', () => {
  it('handles call.member_added events', () => {
    const state = new CallState();
    const initialMembers: MemberResponse[] = [
      {
        user_id: 'user0',
      } as MemberResponse,
    ];
    state.setMembers(initialMembers);
    const handler = watchCallMemberAdded(state);
    handler({
      type: 'call.member_added',
      members: [
        { user_id: 'user1' } as MemberResponse,
        { user_id: 'user2' } as MemberResponse,
      ],
    } as StreamVideoEvent);

    const updatedMembers = state.members;
    updatedMembers.forEach((member, index) =>
      expect(member.user_id).toBe(`user${index}`),
    );
  });

  it('handles call.member_removed events', () => {
    const state = new CallState();
    const initialMembers: MemberResponse[] = [
      {
        user_id: 'user0',
      } as MemberResponse,
      {
        user_id: 'user1',
      } as MemberResponse,
      {
        user_id: 'user2',
      } as MemberResponse,
    ];
    state.setMembers(initialMembers);
    const removedMembers = ['user1'];
    const handler = watchCallMemberRemoved(state);
    handler({
      type: 'call.member_removed',
      members: removedMembers,
    } as StreamVideoEvent);

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
    const handler = watchCallMemberUpdatedPermission(state);
    handler({
      type: 'call.member_updated_permission',
      members: [
        { ...user1, role: 'viewer' },
        { ...user0, role: 'host' },
      ],
    } as StreamVideoEvent);

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
    const handler = watchCallMemberUpdated(state);
    handler({
      type: 'call.member_updated',
      members: [{ ...user1, user: { name: 'John' } }],
    } as StreamVideoEvent);

    const updatedMembers = state.members;
    expect(updatedMembers[0].user.name).toBe('Jane');
    expect(updatedMembers[1].user.name).toBe('John');
    expect(updatedMembers[2].user.name).toBe('Adam');
  });
});
