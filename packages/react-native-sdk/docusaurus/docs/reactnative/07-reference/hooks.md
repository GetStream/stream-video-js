# Hooks

## Functions

### useAcceptedCall

▸ **useAcceptedCall**(): `undefined` \| `CallAcceptedEvent`

#### Returns

`undefined` \| `CallAcceptedEvent`

#### Defined in

[src/hooks/call.ts:79](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/call.ts#L79)

___

### useActiveCall

▸ **useActiveCall**(): `undefined` \| `Call`

Utility hook which provides controller for the currently active call and active call's metadata.
`activeCall$` will be set after calling [`join` on a `Call` instance](./Call/#join) and cleared after calling [`leave`](./Call.md/#leave).

#### Returns

`undefined` \| `Call`

#### Defined in

[src/hooks/call.ts:48](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/call.ts#L48)

___

### useConnectedUser

▸ **useConnectedUser**(): `undefined` \| `User`

#### Returns

`undefined` \| `User`

#### Defined in

[src/hooks/user.ts:4](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/user.ts#L4)

___

### useCurrentCallStatsReport

▸ **useCurrentCallStatsReport**(): `undefined` \| `CallStatsReport`

Utility hook which provides the latest stats report of the current call.

The latest stats report of the current call.
When stats gathering is enabled, this observable will emit a new value
at a regular (configurable) interval.

Consumers of this observable can implement their own batching logic
in case they want to show historical stats data.

#### Returns

`undefined` \| `CallStatsReport`

#### Defined in

[src/hooks/call.ts:31](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/call.ts#L31)

___

### useDominantSpeaker

▸ **useDominantSpeaker**(): `undefined` \| `StreamVideoParticipant`

Utility hook which provides the dominant speaker of the current call.

#### Returns

`undefined` \| `StreamVideoParticipant`

#### Defined in

[src/hooks/call.ts:39](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/call.ts#L39)

___

### useHasOngoingScreenShare

▸ **useHasOngoingScreenShare**(): `boolean`

Utility hook which provides a boolean indicating whether there is
a participant in the current call which shares their screen.

#### Returns

`boolean`

#### Defined in

[src/hooks/call.ts:16](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/call.ts#L16)

___

### useIncomingCalls

▸ **useIncomingCalls**(): `CallMetadata`[]

Utility hook which provides a list of all incoming ring calls (somebody calls me).

#### Returns

`CallMetadata`[]

#### Defined in

[src/hooks/call.ts:66](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/call.ts#L66)

___

### useIsCallRecordingInProgress

▸ **useIsCallRecordingInProgress**(): `boolean`

Utility hook which provides information whether the current call is being recorded.

#### Returns

`boolean`

#### Defined in

[src/hooks/call.ts:7](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/call.ts#L7)

___

### useLocalParticipant

▸ **useLocalParticipant**(): `undefined` \| `StreamVideoLocalParticipant`

A hook which provides a StreamVideoLocalParticipant object.
It signals that I have joined a call.

#### Returns

`undefined` \| `StreamVideoLocalParticipant`

#### Defined in

[src/hooks/participants.ts:16](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/participants.ts#L16)

___

### useOutgoingCalls

▸ **useOutgoingCalls**(): `CallMetadata`[]

Utility hook which provides a list of all outgoing ring calls (I call somebody).

#### Returns

`CallMetadata`[]

#### Defined in

[src/hooks/call.ts:74](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/call.ts#L74)

___

### useParticipants

▸ **useParticipants**(): (`StreamVideoParticipant` \| `StreamVideoLocalParticipant`)[]

A hook which provides a list of all participants that have joined an active call.

#### Returns

(`StreamVideoParticipant` \| `StreamVideoLocalParticipant`)[]

#### Defined in

[src/hooks/participants.ts:7](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/participants.ts#L7)

___

### usePendingCalls

▸ **usePendingCalls**(): `CallMetadata`[]

Utility hook which provides a list of all notifications about created calls.
In the ring call settings, these calls can be outgoing (I have called somebody)
or incoming (somebody has called me).

#### Returns

`CallMetadata`[]

#### Defined in

[src/hooks/call.ts:58](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/call.ts#L58)

___

### useRemoteParticipants

▸ **useRemoteParticipants**(): `StreamVideoParticipant`[]

A hook which provides a list of all other participants than me that have joined an active call.

#### Returns

`StreamVideoParticipant`[]

#### Defined in

[src/hooks/participants.ts:24](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/participants.ts#L24)

___

### useStore

▸ **useStore**(): `StreamVideoReadOnlyStateStore`

Utility hook which provides access to client's state store.

#### Returns

`StreamVideoReadOnlyStateStore`

#### Defined in

[src/hooks/store.ts:6](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/hooks/store.ts#L6)

___

### useStreamVideoClient

▸ **useStreamVideoClient**(): `undefined` \| `StreamVideoClient`

#### Returns

`undefined` \| `StreamVideoClient`

#### Defined in

[src/contexts/StreamVideoContext.tsx:27](https://github.com/GetStream/stream-video-js/blob/eb462309/packages/react-bindings/src/contexts/StreamVideoContext.tsx#L27)
