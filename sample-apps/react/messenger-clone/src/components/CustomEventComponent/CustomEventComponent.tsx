import { EventComponent, EventComponentProps } from 'stream-chat-react';

export const CustomEventComponent = (props: EventComponentProps) => {
  return (
    <>
      <EventComponent {...props} />
      {/* TODO: custom event component */}
    </>
  );
};
