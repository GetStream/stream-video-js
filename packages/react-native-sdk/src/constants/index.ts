import { theme } from '../theme';

export const MAX_AVATARS_IN_VIEW = 3;

export const LOCAL_VIDEO_VIEW_STYLE = {
  height: 140,
  width: 80,
  borderRadius: theme.rounded.sm,
};

export const defaultEmojiReactions: Record<string, string | JSX.Element> = {
  ':like:': '👍',
  ':raise-hand:': '✋',
  ':fireworks:': '🎉',
  ':heart:': '❤️',
  ':rocket:': '🚀',
};
