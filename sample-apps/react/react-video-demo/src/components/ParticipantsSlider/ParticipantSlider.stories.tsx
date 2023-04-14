import { ParticipantsSlider } from './ParticipantsSlider';

export default {
  component: ParticipantsSlider,
  subcomponents: {},
  title: 'ParticipantsSlider',
};

export const KichinSink = (props: any) => {
  return (
    <ParticipantsSlider
      {...props}
      mode="vertical"
      participants={[1, 2, 4, 5, 6, 6, 7, 8, 9, 9]}
    />
  );
};
