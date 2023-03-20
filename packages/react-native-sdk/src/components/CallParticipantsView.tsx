import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { ParticipantView } from './ParticipantView';
import { LocalVideoView } from './LocalVideoView';
import { useRemoteParticipants } from '@stream-io/video-react-bindings';
import { StreamVideoParticipant } from '@stream-io/video-client';

const putRemoteParticipantsInView = (
  remoteParticipants: StreamVideoParticipant[],
) => {
  const speakingParticipants = remoteParticipants.filter(
    (participant) => participant.isDominantSpeaker || participant.isSpeaking,
  );

  const notSpeakingParticipants = remoteParticipants.filter(
    (participant) => !participant.isSpeaking && !participant.isDominantSpeaker,
  );

  return [...speakingParticipants, ...notSpeakingParticipants];
};

/**
 * CallParticipantsView is a component that displays the participants in a call.
 * This component supports the rendering of up to 5 participants.
 *
 * | 2 Participants | 3 Participants | 4 Participants | 5 Participants |
 * | :--- | :--- | :--- | :----: |
 * |![call-participants-view-1](https://user-images.githubusercontent.com/25864161/217495022-b1964df9-fd4a-4ed9-924a-33fc9d2040fd.png) | ![call-participants-view-2](https://user-images.githubusercontent.com/25864161/217495029-e2e44d11-64c0-4eb2-9efa-d86c1875be55.png) | ![call-participants-view-3](https://user-images.githubusercontent.com/25864161/217495037-835c3b9b-3380-4f09-8776-14e2989a76db.png) | ![call-participants-view-4](https://user-images.githubusercontent.com/25864161/217495043-17081d48-c92c-4f4f-937c-c0696172e1d3.png) |
 */
export const CallParticipantsView = () => {
  let remoteParticipants = useRemoteParticipants();
  const isUserAloneInCall = remoteParticipants.length === 0;

  const participantsToDisplay = useMemo(
    () =>
      remoteParticipants.reduce(
        (result: StreamVideoParticipant[][], value, i, arr) => {
          if (i % 2 === 0) result.push(arr.slice(i, i + 2));
          return result;
        },
        [],
      ),
    [remoteParticipants],
  );
  if (isUserAloneInCall) return <LocalVideoView layout={'fullscreen'} />;

  return (
    <View style={{ flex: 1 }}>
      <LocalVideoView layout={'floating'} />
      <FlatList
        data={participantsToDisplay}
        renderItem={({
          item: [firstParticipantInRow, secondParticipantInRow],
          index,
        }) => {
          return (
            <View
              style={{
                flexDirection: 'row',
                flex: 1,
              }}
              key={`${firstParticipantInRow.userId}/${firstParticipantInRow.sessionId}`}
            >
              <View
                style={{
                  height: 200,
                  flex: 1,
                  margin: 8,
                }}
              >
                {firstParticipantInRow && (
                  <ParticipantView
                    participant={firstParticipantInRow}
                    containerStyle={styles.participantView}
                    kind="video"
                  />
                )}
              </View>
              <View
                style={{
                  height: 200,
                  flex: 1,
                  margin: 8,
                }}
              >
                {secondParticipantInRow && (
                  <ParticipantView
                    participant={secondParticipantInRow}
                    containerStyle={styles.participantView}
                    kind="video"
                  />
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  participantView: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
  },
});
