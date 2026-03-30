import type { DeepPartial, Theme } from 'stream-chat-react-native';

const getChatStyle = (): DeepPartial<Theme> => ({
  avatar: {
    image: {
      height: 32,
      width: 32,
    },
  },
});

export const useStreamChatTheme = () => {
  return getChatStyle();
};
