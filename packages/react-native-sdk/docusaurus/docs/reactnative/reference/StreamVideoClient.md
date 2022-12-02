# StreamVideoClient

A `StreamVideoClient` instance lets you communicate with our API, and sign in with the current user.

## Constructors

### constructor

• **new StreamVideoClient**(`apiKey`, `opts`)

You should create only one instance of `StreamVideoClient`.

**`Angular`**

If you're using our Angular SDK, you shouldn't be calling the `constructor` directly, instead you should be using [`StreamVideoClient` service](./StreamVideoClient.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `apiKey` | `string` | your Stream API key |
| `opts` | `StreamVideoClientOptions` |  |

#### Defined in

[src/StreamVideoClient.ts:72](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L72)

## Properties

### readOnlyStateStore

• `Readonly` **readOnlyStateStore**: `StreamVideoReadOnlyStateStore`

A reactive store that exposes the state variables in a reactive manner - you can subscribe to changes of the different state variables.

**`Angular`**

If you're using our Angular SDK, you shouldn't be interacting with the state store directly, instead, you should be using the [`StreamVideoService`](./StreamVideoService.md).

#### Defined in

[src/StreamVideoClient.ts:59](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L59)

___

### writeableStateStore

• `Readonly` **writeableStateStore**: `StreamVideoWriteableStateStore`

#### Defined in

[src/StreamVideoClient.ts:61](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L61)

## Methods

### acceptCall

▸ **acceptCall**(`callCid`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callCid` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:203](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L203)

___

### cancelCall

▸ **cancelCall**(`callCid`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callCid` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:217](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L217)

___

### connect

▸ **connect**(`apiKey`, `token`, `user`): `Promise`<`void`\>

Connects the given user to the client.
Only one user can connect at a time, if you want to change users, call `disconnect` before connecting a new user.
If the connection is successful, the connected user state variable will be updated accordingly.

#### Parameters

| Name | Type |
| :------ | :------ |
| `apiKey` | `string` |
| `token` | `string` |
| `user` | `UserInput` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:106](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L106)

___

### createCall

▸ **createCall**(`data`): `Promise`<`undefined` \| `CallEnvelope`\>

Allows you to create new calls with the given parameters. If a call with the same combination of type and id already exists, this will return an error.

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `CreateCallRequest` |

#### Returns

`Promise`<`undefined` \| `CallEnvelope`\>

A call metadata with information about the call.

#### Defined in

[src/StreamVideoClient.ts:197](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L197)

___

### disconnect

▸ **disconnect**(): `Promise`<`void`\>

Disconnects the currently connected user from the client.

If the connection is successfully disconnected, the connected user state variable will be updated accordingly

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:129](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L129)

___

### getOrCreateCall

▸ **getOrCreateCall**(`data`): `Promise`<`undefined` \| `CallEnvelope`\>

Allows you to create new calls with the given parameters. If a call with the same combination of type and id already exists, it will return the existing call.

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `GetOrCreateCallRequest` |

#### Returns

`Promise`<`undefined` \| `CallEnvelope`\>

A call metadata with information about the call.

#### Defined in

[src/StreamVideoClient.ts:182](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L182)

___

### joinCall

▸ **joinCall**(`data`, `sessionId?`): `Promise`<`undefined` \| [`Call`](Call.md)\>

Allows you to create a new call with the given parameters and joins the call immediately. If a call with the same combination of `type` and `id` already exists, it will join the existing call.

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `JoinCallRequest` |
| `sessionId?` | `string` |

#### Returns

`Promise`<`undefined` \| [`Call`](Call.md)\>

A [`Call`](./Call.md) instance that can be used to interact with the call.

#### Defined in

[src/StreamVideoClient.ts:230](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L230)

___

### off

▸ **off**<`T`\>(`event`, `fn`): `undefined` \| `void`

Remove subscription for WebSocket events that were created by the `on` method.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` |
| `fn` | `StreamEventListener`<`T`\> |

#### Returns

`undefined` \| `void`

#### Defined in

[src/StreamVideoClient.ts:156](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L156)

___

### on

▸ **on**<`T`\>(`event`, `fn`): `undefined` \| () => `void`

You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive state store.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` |
| `fn` | `StreamEventListener`<`T`\> |

#### Returns

`undefined` \| () => `void`

#### Defined in

[src/StreamVideoClient.ts:146](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L146)

___

### rejectCall

▸ **rejectCall**(`callCid`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callCid` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:210](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L210)

___

### reportCallStatEvent

▸ **reportCallStatEvent**(`statEvent`): `Promise`<`ReportCallStatEventResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `statEvent` | `ReportCallStatEventRequest` |

#### Returns

`Promise`<`ReportCallStatEventResponse`\>

#### Defined in

[src/StreamVideoClient.ts:367](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L367)

___

### reportCallStats

▸ **reportCallStats**(`stats`): `Promise`<`ReportCallStatsResponse`\>

We should make this an internal method, SDKs shouldn't need this.

#### Parameters

| Name | Type |
| :------ | :------ |
| `stats` | `ReportCallStatsRequest` |

#### Returns

`Promise`<`ReportCallStatsResponse`\>

#### Defined in

[src/StreamVideoClient.ts:302](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L302)

___

### setHealthcheckPayload

▸ **setHealthcheckPayload**(`hc`): `void`

**`Deprecated`**

We should move this functionality inside the client and make this an internal function.

#### Parameters

| Name | Type |
| :------ | :------ |
| `hc` | `WebsocketHealthcheck` |

#### Returns

`void`

#### Defined in

[src/StreamVideoClient.ts:166](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L166)

___

### setParticipantIsPinned

▸ **setParticipantIsPinned**(`sessionId`, `isPinned`): `void`

Sets the participant.isPinned value.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sessionId` | `string` | the session id of the participant |
| `isPinned` | `boolean` | the value to set the participant.isPinned |

#### Returns

`void`

#### Defined in

[src/StreamVideoClient.ts:380](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L380)

___

### startRecording

▸ **startRecording**(`callId`, `callType`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callId` | `string` |
| `callType` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:273](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L273)

___

### stopRecording

▸ **stopRecording**(`callId`, `callType`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callId` | `string` |
| `callType` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:285](https://github.com/GetStream/stream-video-js/blob/664a9bc/packages/client/src/StreamVideoClient.ts#L285)
