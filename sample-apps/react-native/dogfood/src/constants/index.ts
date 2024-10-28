import { StreamReactionType } from '@stream-io/video-react-native-sdk';

export const BUTTON_HEIGHT = 50;
export const INPUT_HEIGHT = 50;
export const AVATAR_SIZE = 50;

export const Z_INDEX = {
  IN_BACK: 0,
  IN_MIDDLE: 1,
  IN_FRONT: 2,
};

export const reactions: StreamReactionType[] = [
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
