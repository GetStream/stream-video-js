import { theme } from '../theme';

export const LOCAL_VIDEO_VIEW_STYLE = {
  height: 140,
  width: 80,
  borderRadius: theme.rounded.sm,
};

export const defaultEmojiReactions = [
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
