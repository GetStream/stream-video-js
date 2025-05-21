import { type StreamReactionType } from '../components';

export const FLOATING_VIDEO_VIEW_STYLE = {
  height: 140,
  width: 80,
  borderRadius: 10,
};

export const defaultEmojiReactions: StreamReactionType[] = [
  {
    type: 'reaction',
    emoji_code: ':rolling_on_the_floor_laughing:',
    custom: {},
    icon: '🤣',
  },
  {
    type: 'reaction',
    emoji_code: ':like:',
    custom: {},
    icon: '👍',
  },
  {
    type: 'reaction',
    emoji_code: ':rocket:',
    custom: {},
    icon: '🚀',
  },
  {
    type: 'reaction',
    emoji_code: ':dislike:',
    custom: {},
    icon: '👎',
  },
  {
    type: 'reaction',
    emoji_code: ':fireworks:',
    custom: {},
    icon: '🎉',
  },
  {
    type: 'reaction',
    emoji_code: ':raised-hands:',
    custom: {},
    icon: '🙌',
  },
  {
    type: 'raised-hand',
    emoji_code: ':raised-hand:',
    custom: {},
    icon: '✋',
  },
];

export const Z_INDEX = {
  IN_BACK: 0,
  IN_MIDDLE: 1,
  IN_FRONT: 2,
};
