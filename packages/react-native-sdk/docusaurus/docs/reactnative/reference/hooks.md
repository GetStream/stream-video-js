# Hooks

## Interfaces

- [StreamVideoProps](interfaces/StreamVideoProps)

## Functions

### StreamVideo

▸ **StreamVideo**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`StreamVideoProps`](interfaces/StreamVideoProps.md)\> |

#### Returns

`Element`

#### Defined in

[src/contexts/StreamVideoContext.tsx:12](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/contexts/StreamVideoContext.tsx#L12)

___

### useActiveCall

▸ **useActiveCall**(): `undefined` \| `Call`

Utility hook which provides the currently active call.

#### Returns

`undefined` \| `Call`

#### Defined in

[src/hooks/call.ts:31](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/call.ts#L31)

___

### useActiveRingCall

▸ **useActiveRingCall**(): `undefined` \| `Call`

Utility hook which provides the currently active ring-call meta.

#### Returns

`undefined` \| `Call`

#### Defined in

[src/hooks/call.ts:39](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/call.ts#L39)

___

### useActiveRingCallDetails

▸ **useActiveRingCallDetails**(): `undefined` \| `CallDetails`

Utility hook which provides the currently active ring-call details.

#### Returns

`undefined` \| `CallDetails`

#### Defined in

[src/hooks/call.ts:55](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/call.ts#L55)

___

### useCurrentCallStatsReport

▸ **useCurrentCallStatsReport**(): `undefined` \| `CallStatsReport`

Utility hook which provides the latest stats report of the current call.

#### Returns

`undefined` \| `CallStatsReport`

#### Defined in

[src/hooks/call.ts:15](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/call.ts#L15)

___

### useDominantSpeaker

▸ **useDominantSpeaker**(): `undefined` \| `string`

Utility hook which provides the dominant speaker of the current call.

#### Returns

`undefined` \| `string`

#### Defined in

[src/hooks/call.ts:23](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/call.ts#L23)

___

### useIncomingRingCalls

▸ **useIncomingRingCalls**(): `Call`[]

Utility hook which provides a list of all incoming ring calls.

#### Returns

`Call`[]

#### Defined in

[src/hooks/call.ts:63](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/call.ts#L63)

___

### useIsCallRecordingInProgress

▸ **useIsCallRecordingInProgress**(): `boolean`

Utility hook which provides information whether the current call is being recorded.

#### Returns

`boolean`

#### Defined in

[src/hooks/call.ts:7](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/call.ts#L7)

___

### useLocalParticipant

▸ **useLocalParticipant**(): `undefined` \| `StreamVideoLocalParticipant`

#### Returns

`undefined` \| `StreamVideoLocalParticipant`

#### Defined in

[src/hooks/participants.ts:9](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/participants.ts#L9)

___

### useParticipants

▸ **useParticipants**(): (`StreamVideoParticipant` \| `StreamVideoLocalParticipant`)[]

#### Returns

(`StreamVideoParticipant` \| `StreamVideoLocalParticipant`)[]

#### Defined in

[src/hooks/participants.ts:4](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/participants.ts#L4)

___

### useRemoteParticipants

▸ **useRemoteParticipants**(): `StreamVideoParticipant`[]

#### Returns

`StreamVideoParticipant`[]

#### Defined in

[src/hooks/participants.ts:14](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/participants.ts#L14)

___

### useStore

▸ **useStore**(): `StreamVideoReadOnlyStateStore`

#### Returns

`StreamVideoReadOnlyStateStore`

#### Defined in

[src/hooks/store.ts:3](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/store.ts#L3)

___

### useStreamVideoClient

▸ **useStreamVideoClient**(): `undefined` \| `StreamVideoClient`

#### Returns

`undefined` \| `StreamVideoClient`

#### Defined in

[src/contexts/StreamVideoContext.tsx:21](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/contexts/StreamVideoContext.tsx#L21)

___

### useTerminatedRingCall

▸ **useTerminatedRingCall**(): `undefined` \| `Call`

Utility hook which provides the currently terminated ring call meta.

#### Returns

`undefined` \| `Call`

#### Defined in

[src/hooks/call.ts:47](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/react-bindings/src/hooks/call.ts#L47)
