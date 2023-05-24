import { ChannelSearchProps, ChannelSearch } from 'stream-chat-react';
import { QuickDial } from '../QuickDial';

export const CustomChannelSearch = (props: ChannelSearchProps) => {
  return (
    <>
      <ChannelSearch {...props} />
      {/* TODO: add call stuff */}
      <QuickDial />
    </>
  );
};
