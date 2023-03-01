# StreamVideoClient

A `StreamVideoClient` instance lets you communicate with our API, and authenticate users.

## Constructors

### constructor

• **new StreamVideoClient**(`apiKey`, `opts?`, `callConfig?`)

You should create only one instance of `StreamVideoClient`.

**`Angular`**

If you're using our Angular SDK, you shouldn't be calling the `constructor` directly, instead you should be using [`StreamVideoService`](./StreamVideoService.md/#init).

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `apiKey` | `string` | `undefined` | your Stream API key |
| `opts?` | `StreamClientOptions` | `undefined` | the options for the client. |
| `callConfig?` | `CallConfig` | `CALL_CONFIG.meeting` | custom call configuration |

#### Defined in

[src/StreamVideoClient.ts:71](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L71)

## Properties

### callConfig

• **callConfig**: `CallConfig`

Configuration parameters for controlling call behavior.

#### Defined in

[src/StreamVideoClient.ts:54](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L54)

___

### coordinatorClient

• **coordinatorClient**: `StreamCoordinatorClient`

#### Defined in

[src/StreamVideoClient.ts:62](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L62)

___

### readOnlyStateStore

• `Readonly` **readOnlyStateStore**: `StreamVideoReadOnlyStateStore`

A reactive store that exposes all the state variables in a reactive manner - you can subscribe to changes of the different state variables. Our library is built in a way that all state changes are exposed in this store, so all UI changes in your application should be handled by subscribing to these variables.

**`Angular`**

If you're using our Angular SDK, you shouldn't be interacting with the state store directly, instead, you should be using the [`StreamVideoService`](./StreamVideoService.md).

#### Defined in

[src/StreamVideoClient.ts:59](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L59)

## Methods

### acceptCall

▸ **acceptCall**(`callId`, `callType`): `Promise`<`undefined` \| [`Call`](Call.md)\>

Signals other users that I have accepted the incoming call.
Causes the `CallAccepted` event to be emitted to all the call members.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callId` | `string` |
| `callType` | `string` |

#### Returns

`Promise`<`undefined` \| [`Call`](Call.md)\>

#### Defined in

[src/StreamVideoClient.ts:256](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L256)

___

### cancelCall

▸ **cancelCall**(`callId`, `callType`): `Promise`<`void`\>

Signals other users that I have cancelled my call to them before they accepted it.
Causes the CallCancelled event to be emitted to all the call members.

Cancelling a call is only possible before the local participant joined the call.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callId` | `string` |
| `callType` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:290](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L290)

___

### connectUser

▸ **connectUser**(`user`, `tokenOrProvider`): `Promise`<`void`\>

Connects the given user to the client.
Only one user can connect at a time, if you want to change users, call `disconnectUser` before connecting a new user.
If the connection is successful, the connected user [state variable](#readonlystatestore) will be updated accordingly.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `user` | `User` | the user to connect. |
| `tokenOrProvider` | `TokenOrProvider` | a token or a function that returns a token. |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:105](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L105)

___

### disconnectUser

▸ **disconnectUser**(): `Promise`<`void`\>

Disconnects the currently connected user from the client.

If the connection is successfully disconnected, the connected user [state variable](#readonlystatestore) will be updated accordingly

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:170](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L170)

___

### getOrCreateCall

▸ **getOrCreateCall**(`id`, `type`, `data?`): `Promise`<`undefined` \| `GetOrCreateCallResponse`\>

Allows you to create new calls with the given parameters.
If a call with the same combination of type and id already exists, it will be returned.

Causes the CallCreated event to be emitted to all the call members in case this call didnot exist before.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` | the id of the call. |
| `type` | `string` | the type of the call. |
| `data?` | `GetOrCreateCallRequest` | the data for the call. |

#### Returns

`Promise`<`undefined` \| `GetOrCreateCallResponse`\>

A call metadata with information about the call.

#### Defined in

[src/StreamVideoClient.ts:214](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L214)

___

### joinCall

▸ **joinCall**(`id`, `type`, `data?`): `Promise`<`undefined` \| [`Call`](Call.md)\>

Allows you to create a new call with the given parameters and joins the call immediately.
If a call with the same combination of `type` and `id` already exists, it will join the existing call.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` | the id of the call. |
| `type` | `string` | the type of the call. |
| `data?` | `JoinCallRequest` | the data for the call. |

#### Returns

`Promise`<`undefined` \| [`Call`](Call.md)\>

A [`Call`](./Call.md) instance that can be used to interact with the call.

#### Defined in

[src/StreamVideoClient.ts:319](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L319)

___

### off

▸ **off**(`event`, `callback`): `void`

Remove subscription for WebSocket events that were created by the `on` method.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `string` | the event name. |
| `callback` | `EventHandler` | the callback which was passed to the `on` method. |

#### Returns

`void`

#### Defined in

[src/StreamVideoClient.ts:199](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L199)

___

### on

▸ **on**(`eventName`, `callback`): () => `void`

You can subscribe to WebSocket events provided by the API.
To remove a subscription, call the `off` method or, execute the returned unsubscribe function.
Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive [state store](#readonlystatestore).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` | the event name. |
| `callback` | `EventHandler` | the callback which will be called when the event is emitted. |

#### Returns

`fn`

an unsubscribe function.

▸ (): `void`

##### Returns

`void`

#### Defined in

[src/StreamVideoClient.ts:189](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L189)

___

### queryCalls

▸ **queryCalls**(`filterConditions`, `sort`, `limit?`, `next?`): `Promise`<`QueryCallsResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filterConditions` | `Object` |
| `sort` | `SortParamRequest`[] |
| `limit?` | `number` |
| `next?` | `string` |

#### Returns

`Promise`<`QueryCallsResponse`\>

#### Defined in

[src/StreamVideoClient.ts:380](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L380)

___

### rejectCall

▸ **rejectCall**(`callId`, `callType`): `Promise`<`void`\>

Signals other users that I have rejected the incoming call.
Causes the `CallRejected` event to be emitted to all the call members.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callId` | `string` |
| `callType` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/StreamVideoClient.ts:270](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L270)

___

### requestCallPermissions

▸ **requestCallPermissions**(`callId`, `callType`, `data`): `Promise`<`RequestPermissionResponse`\>

Sends a `call.permission_request` event to all users connected to the call. The call settings object contains infomration about which permissions can be requested during a call (for example a user might be allowed to request permission to publish audio, but not video).

#### Parameters

| Name | Type |
| :------ | :------ |
| `callId` | `string` |
| `callType` | `string` |
| `data` | `RequestPermissionRequest` |

#### Returns

`Promise`<`RequestPermissionResponse`\>

#### Defined in

[src/StreamVideoClient.ts:414](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L414)

___

### setParticipantIsPinned

▸ **setParticipantIsPinned**(`sessionId`, `isPinned`): `void`

Sets the `participant.isPinned` value.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sessionId` | `string` | the session id of the participant |
| `isPinned` | `boolean` | the value to set the participant.isPinned |

#### Returns

`void`

#### Defined in

[src/StreamVideoClient.ts:485](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L485)

___

### startRecording

▸ **startRecording**(`callId`, `callType`): `Promise`<`unknown`\>

Starts recording for the call described by the given `callId` and `callType`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callId` | `string` | can be extracted from a [`Call` instance](./Call.md/#data) |
| `callType` | `string` | can be extracted from a [`Call` instance](./Call.md/#data) |

#### Returns

`Promise`<`unknown`\>

#### Defined in

[src/StreamVideoClient.ts:372](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L372)

___

### stopRecording

▸ **stopRecording**(`callId`, `callType`): `Promise`<`unknown`\>

Stops recording for the call described by the given `callId` and `callType`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callId` | `string` | can be extracted from a [`Call` instance](./Call.md/#data) |
| `callType` | `string` | can be extracted from a [`Call` instance](./Call.md/#data) |

#### Returns

`Promise`<`unknown`\>

#### Defined in

[src/StreamVideoClient.ts:399](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L399)

___

### updateUserPermissions

▸ **updateUserPermissions**(`callId`, `callType`, `data`): `Promise`<`UpdateUserPermissionsResponse`\>

Allows you to grant or revoke a specific permission to a user in a call. The permissions are specific to the call experience and do not survive the call itself.

When revoking a permission, this endpoint will also mute the relevant track from the user. This is similar to muting a user with the difference that the user will not be able to unmute afterwards.

Supported permissions that can be granted or revoked: `send-audio`, `send-video` and `screenshare`.

`call.permissions_updated` event is sent to all members of the call.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callId` | `string` |
| `callType` | `string` |
| `data` | `UpdateUserPermissionsRequest` |

#### Returns

`Promise`<`UpdateUserPermissionsResponse`\>

#### Defined in

[src/StreamVideoClient.ts:440](https://github.com/GetStream/stream-video-js/blob/ac9956c0/packages/client/src/StreamVideoClient.ts#L440)
