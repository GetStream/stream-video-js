# Components

## Interfaces

- [ActiveCallProps](../Interfaces/ActiveCallProps/)
- [AvatarProps](../Interfaces/AvatarProps/)
- [CallControlsViewProps](../Interfaces/CallControlsViewProps/)
- [LobbyViewProps](../Interfaces/LobbyViewProps/)
- [LocalVideoViewProps](../Interfaces/LocalVideoViewProps/)
- [OutgoingCallViewProps](../Interfaces/OutgoingCallViewProps/)
- [VideoRendererProps](../Interfaces/VideoRendererProps/)

## Functions

### ActiveCall

▸ **ActiveCall**(`props`): `Element`

View for an active call, includes call controls and participant handling.

| 2 Participants | 3 Participants | 4 Participants | 5 Participants |
| :--- | :--- | :--- | :----: |
|![active-call-2](https://user-images.githubusercontent.com/25864161/217351458-6cb4b0df-6071-45f5-89b6-fe650d950502.png) | ![active-call-3](https://user-images.githubusercontent.com/25864161/217351461-908a1887-7cf0-4945-bedd-d6598902be2d.png) | ![active-call-4](https://user-images.githubusercontent.com/25864161/217351465-b2a22178-7593-4639-96dd-6fb692af2dc5.png) | ![active-call-5](https://user-images.githubusercontent.com/25864161/217351453-6547b0a3-4ecc-435f-b2d9-7d511d5d0328.png) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`ActiveCallProps`](../Interfaces/ActiveCallProps/) |

#### Returns

`Element`

#### Defined in

[src/components/ActiveCall.tsx:35](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/ActiveCall.tsx#L35)

___

### Avatar

▸ **Avatar**(`props`): `Element`

Shows either user's image or initials based on the user state and existence of
their image.

| User's Image | User's Initials |
| :--- | :----: |
|![avatar-1](https://user-images.githubusercontent.com/25864161/217467045-2d4c8b4e-d4ec-48c1-8ede-4468854826af.png) | ![avatar-2](https://user-images.githubusercontent.com/25864161/217467043-e7a7f2a1-70a7-4d83-8d1e-6463391194ae.png)|

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`AvatarProps`](../Interfaces/AvatarProps/) |

#### Returns

`Element`

#### Defined in

[src/components/Avatar.tsx:31](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/Avatar.tsx#L31)

___

### CallControlsView

▸ **CallControlsView**(`«destructured»`): `Element`

Shows a list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
the user can trigger within an active call.

| Call Controls |
| :--- |
| ![call-controls-view](https://user-images.githubusercontent.com/25864161/217349666-af0f3278-393e-449d-b30e-2d1b196abe5e.png) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`CallControlsViewProps`](../Interfaces/CallControlsViewProps/) |

#### Returns

`Element`

#### Defined in

[src/components/CallControlsView.tsx:33](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/CallControlsView.tsx#L33)

___

### CallParticipantsInfoView

▸ **CallParticipantsInfoView**(): `Element`

Shows information about the call, it's participants in the call and
their mute states, handler to trigger options (TBD, permissions not impl)
and options to invite more people to the call.

| Participants List | Options Modal is Open |
| :--- | :----: |
|![call-participants-info-view-1](https://user-images.githubusercontent.com/25864161/217341952-1e875bc3-e31f-42eb-918b-307eace116b1.png) | ![call-participants-info-view-2](https://user-images.githubusercontent.com/25864161/217341960-5016b678-d1a5-4ecf-bb4b-e463987b9cae.png)|

#### Returns

`Element`

#### Defined in

[src/components/CallParticipantsInfoView.tsx:80](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/CallParticipantsInfoView.tsx#L80)

___

### CallParticipantsView

▸ **CallParticipantsView**(): ``null`` \| `Element`

CallParticipantsView is a component that displays the participants in a call.
This component supports the rendering of up to 5 participants.

| 2 Participants | 3 Participants | 4 Participants | 5 Participants |
| :--- | :--- | :--- | :----: |
|![call-participants-view-1](https://user-images.githubusercontent.com/25864161/217495022-b1964df9-fd4a-4ed9-924a-33fc9d2040fd.png) | ![call-participants-view-2](https://user-images.githubusercontent.com/25864161/217495029-e2e44d11-64c0-4eb2-9efa-d86c1875be55.png) | ![call-participants-view-3](https://user-images.githubusercontent.com/25864161/217495037-835c3b9b-3380-4f09-8776-14e2989a76db.png) | ![call-participants-view-4](https://user-images.githubusercontent.com/25864161/217495043-17081d48-c92c-4f4f-937c-c0696172e1d3.png) |

#### Returns

``null`` \| `Element`

#### Defined in

[src/components/CallParticipantsView.tsx:83](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/CallParticipantsView.tsx#L83)

___

### IncomingCallView

▸ **IncomingCallView**(`props`): `Element`

View for the incoming call, after a call is received by a callee in ringing mode and the app is in foreground

| Voice Incoming Call | Group Incoming Call | Video Incoming Call |
|:----|:----|:----:|
|![incoming-call-view-1](https://user-images.githubusercontent.com/25864161/217496690-b7ff223b-4a10-4fad-91f8-54ca30666c7a.png)|![incoming-call-view-2](https://user-images.githubusercontent.com/25864161/217496698-50ced011-7516-4f8f-932e-e50565932bb9.png)|![incoming-call-view-3](https://user-images.githubusercontent.com/25864161/217496704-9d407218-3780-44ed-930a-19f0d9278a46.png)|

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `IncomingCallViewProps` |

#### Returns

`Element`

#### Defined in

[src/components/IncomingCallView.tsx:34](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/IncomingCallView.tsx#L34)

___

### LobbyView

▸ **LobbyView**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`LobbyViewProps`](../Interfaces/LobbyViewProps/) |

#### Returns

`Element`

#### Defined in

[src/components/LobbyView.tsx:53](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/LobbyView.tsx#L53)

___

### LocalVideoView

▸ **LocalVideoView**(`props`): ``null`` \| `Element`

Shows a floating participant UI that can be dragged (to be implemented) within certain bounds.

| Local Video | Local Video in relation to active call screen |
| :---- | :----: |
|![local-video-view-1](https://user-images.githubusercontent.com/25864161/217491433-60848d95-1a14-422e-b4e1-7540f3ba30b4.png)|![local-video-view-2](https://user-images.githubusercontent.com/25864161/217491438-75bad10c-8850-49f5-b3bd-af22995e11c2.png)|

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`LocalVideoViewProps`](../Interfaces/LocalVideoViewProps/) |

#### Returns

``null`` \| `Element`

#### Defined in

[src/components/LocalVideoView.tsx:40](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/LocalVideoView.tsx#L40)

___

### OutgoingCallView

▸ **OutgoingCallView**(`props`): `Element`

View for an outgoing call, after a call is initiated by a caller in ringing mode

| Outgoing Call |
| :---: |
|![outgoing-calo-view-1](https://user-images.githubusercontent.com/25864161/217487315-c32ee3dc-10d7-4726-ae62-de8e8106af86.png)|

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`OutgoingCallViewProps`](../Interfaces/OutgoingCallViewProps/) |

#### Returns

`Element`

#### Defined in

[src/components/OutgoingCallView.tsx:29](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/OutgoingCallView.tsx#L29)

___

### ParticipantView

▸ **ParticipantView**(`props`): `Element`

Renders either the participants' video track or screenShare track
and additional info, by an absence of a video track only an
avatar and audio track will be rendered.

| When Video is Enabled | When Video is Disabled |
| :--- | :----: |
|![participant-view-1](https://user-images.githubusercontent.com/25864161/217489213-d4532ca1-49ee-4ef5-940c-af2e55bc0a5f.png)|![participant-view-2](https://user-images.githubusercontent.com/25864161/217489207-fb20c124-8bce-4c2b-87f9-4fe67bc50438.png)|

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `ParticipantViewProps` |

#### Returns

`Element`

#### Defined in

[src/components/ParticipantView.tsx:48](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/ParticipantView.tsx#L48)

___

### StreamVideo

▸ **StreamVideo**(`props`): `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`StreamVideoProps` & { `callCycleHandlers?`: `CallCycleHandlersType`  }\> |

#### Returns

`Element`

#### Defined in

[src/providers/StreamVideo.tsx:13](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/providers/StreamVideo.tsx#L13)

___

### VideoRenderer

▸ **VideoRenderer**(`props`): `Element`

Lower level component, that represents only the video part (wrapper around the WebRTC)
//Todo: SG: add photo's with all states

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`VideoRendererProps`](../Interfaces/VideoRendererProps/) |

#### Returns

`Element`

#### Defined in

[src/components/VideoRenderer.tsx:68](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/VideoRenderer.tsx#L68)

___

### useCall

▸ **useCall**(): `Object`

A hook which provides a list of all participants that have joined an active call.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `hangupCall` | () => `Promise`<`void`\> |

#### Defined in

[src/hooks/useCall.tsx:8](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/hooks/useCall.tsx#L8)

___

### useCallControls

▸ **useCallControls**(): `Object`

A helper hook which exposes audio, video mute and camera facing mode and
their respective functions to toggle state

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `isAudioMuted` | `boolean` |
| `isCameraOnFrontFacingMode` | `boolean` |
| `isVideoMuted` | `boolean` |
| `toggleAudioMuted` | () => `Promise`<`void`\> |
| `toggleCameraFacingMode` | () => `void` |
| `toggleVideoMuted` | () => `Promise`<`void`\> |

#### Defined in

[src/hooks/useCallControls.tsx:21](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/hooks/useCallControls.tsx#L21)

___

### useCallCycleEffect

▸ **useCallCycleEffect**(`callCycleHandlers`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callCycleHandlers` | `CallCycleHandlersType` |

#### Returns

`void`

#### Defined in

[src/hooks/useCallCycleEffect.tsx:9](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/hooks/useCallCycleEffect.tsx#L9)

___

### useRingCall

▸ **useRingCall**(): `Object`

A helper hook which exposes functions to answerCall, rejectCall, cancelCall

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `answerCall` | () => `void` |
| `cancelCall` | () => `Promise`<`void`\> |
| `rejectCall` | () => `Promise`<`void`\> |

#### Defined in

[src/hooks/useRingCall.tsx:12](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/hooks/useRingCall.tsx#L12)

___

### useStreamVideoStoreSetState

▸ **useStreamVideoStoreSetState**(): `SetStateFuncType`

#### Returns

`SetStateFuncType`

#### Defined in

[src/contexts/createStoreContext.tsx:92](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/contexts/createStoreContext.tsx#L92)

___

### useStreamVideoStoreValue

▸ **useStreamVideoStoreValue**<`SelectorOutput`\>(`selector`): `SelectorOutput`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `SelectorOutput` | extends `boolean` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `selector` | (`store`: `StoreType`) => `SelectorOutput` |

#### Returns

`SelectorOutput`

#### Defined in

[src/contexts/createStoreContext.tsx:75](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/contexts/createStoreContext.tsx#L75)
