import { StreamReactionType } from '../components';

export const FLOATING_VIDEO_VIEW_STYLE = {
  height: 140,
  width: 80,
  borderRadius: 10,
};

export const LOBBY_VIDEO_VIEW_HEIGHT = 240;

export const defaultEmojiReactions: StreamReactionType[] = [
  {
    type: 'reaction',
    emoji_code: ':like:',
    custom: {},
    icon: '👍',
  },
  {
    type: 'raised-hand',
    emoji_code: ':raise-hand:',
    custom: {},
    icon: '✋',
  },
  {
    type: 'reaction',
    emoji_code: ':fireworks:',
    custom: {},
    icon: '🎉',
  },
];

export const Z_INDEX = {
  IN_BACK: 0,
  IN_MIDDLE: 1,
  IN_FRONT: 2,
};
