import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import { ConfigurationValue } from '../src/ConfigurationContext';

const users = ['john', 'jane', 'mark', 'martin', 'anne'];

export const generateScriptTagContent = (data: Partial<ConfigurationValue>) => {
  return `window.setupLayout(${JSON.stringify(data)});`;
};

export const participants = users.map<Partial<StreamVideoParticipant>>(
  (user, index) => ({
    userId: user,
    sessionId: `${user}_${index}`,
    publishedTracks: [],
    isSpeaking: false,
  }),
);

export const participantsWithScreenShare = users.map<
  Partial<StreamVideoParticipant>
>((user, index) => ({
  userId: user,
  sessionId: `${user}_${index}`,
  // FIXME: figure out why SfuModels cannot be imported
  publishedTracks: !index ? [] : [3],
  isSpeaking: false,
}));

export const participantsWithSpeakingFlag = users.map<
  Partial<StreamVideoParticipant>
>((user, index) => ({
  userId: user,
  sessionId: `${user}_${index}`,
  publishedTracks: [],
  isSpeaking: !index,
}));
