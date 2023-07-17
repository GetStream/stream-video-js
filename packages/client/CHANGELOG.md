# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

### [0.0.50](https://github.com/GetStream/stream-video-js/compare/client0.0.49...client0.0.50) (2023-07-17)


### Bug Fixes

* Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))

### [0.0.49](https://github.com/GetStream/stream-video-js/compare/client0.0.48...client0.0.49) (2023-07-17)


### Bug Fixes

* promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))

### [0.0.48](https://github.com/GetStream/stream-video-js/compare/client0.0.47...client0.0.48) (2023-07-14)


### Bug Fixes

* force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)

### [0.0.47](https://github.com/GetStream/stream-video-js/compare/client0.0.46...client0.0.47) (2023-07-14)


### Features

* take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))

### [0.0.46](https://github.com/GetStream/stream-video-js/compare/client0.0.45...client0.0.46) (2023-07-14)


### Bug Fixes

* version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))

### [0.0.45](https://github.com/GetStream/stream-video-js/compare/client0.0.44...client0.0.45) (2023-07-14)


### Features

* fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))

### [0.0.44](https://github.com/GetStream/stream-video-js/compare/client0.0.43...client0.0.44) (2023-07-14)


### Features

* SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))

### [0.0.43](https://github.com/GetStream/stream-video-js/compare/client0.0.42...client0.0.43) (2023-07-12)


### Bug Fixes

* Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))

### [0.0.42](https://github.com/GetStream/stream-video-js/compare/client0.0.41...client0.0.42) (2023-07-12)


### Bug Fixes

* Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))

### [0.0.41](https://github.com/GetStream/stream-video-js/compare/client0.0.40...client0.0.41) (2023-07-10)


### Documentation

* **react-sdk:** add token snippet to audio rooms tutorial ([#739](https://github.com/GetStream/stream-video-js/issues/739)) ([bf0b46c](https://github.com/GetStream/stream-video-js/commit/bf0b46ce40329458ad545c82b70a4099c4afc8f2))

### [0.0.40](https://github.com/GetStream/stream-video-js/compare/client0.0.39...client0.0.40) (2023-07-07)


### Features

* reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))

### [0.0.39](https://github.com/GetStream/stream-video-js/compare/client0.0.38...client0.0.39) (2023-07-07)


### Bug Fixes

* promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))

### [0.0.38](https://github.com/GetStream/stream-video-js/compare/client0.0.37...client0.0.38) (2023-07-07)


### Features

* respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))

### [0.0.37](https://github.com/GetStream/stream-video-js/compare/client0.0.36...client0.0.37) (2023-07-06)


### Features

* Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)


### Bug Fixes

* restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))

### [0.0.36](https://github.com/GetStream/stream-video-js/compare/client0.0.35...client0.0.36) (2023-07-05)


### Bug Fixes

* wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))

### [0.0.35](https://github.com/GetStream/stream-video-js/compare/client0.0.34...client0.0.35) (2023-07-05)


### Bug Fixes

* Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))

### [0.0.34](https://github.com/GetStream/stream-video-js/compare/client0.0.33...client0.0.34) (2023-07-05)


### Bug Fixes

* prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))

### [0.0.33](https://github.com/GetStream/stream-video-js/compare/client0.0.32...client0.0.33) (2023-07-04)

### [0.0.32](https://github.com/GetStream/stream-video-js/compare/client0.0.31...client0.0.32) (2023-07-04)


### Features

* stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))

### [0.0.31](https://github.com/GetStream/stream-video-js/compare/client0.0.30...client0.0.31) (2023-07-03)


### Bug Fixes

* safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))

### [0.0.30](https://github.com/GetStream/stream-video-js/compare/client0.0.29...client0.0.30) (2023-07-03)


### Bug Fixes

* dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))

### [0.0.29](https://github.com/GetStream/stream-video-js/compare/client0.0.28...client0.0.29) (2023-07-03)


### Features

* SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))

### [0.0.28](https://github.com/GetStream/stream-video-js/compare/client0.0.27...client0.0.28) (2023-06-29)


### Features

* Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))

### [0.0.27](https://github.com/GetStream/stream-video-js/compare/client0.0.26...client0.0.27) (2023-06-27)


### Documentation

* Tutorial rewrite ([#709](https://github.com/GetStream/stream-video-js/issues/709)) ([9a14188](https://github.com/GetStream/stream-video-js/commit/9a141883ec2e402e7130c7e41f464439d5cb2800))

### [0.0.26](https://github.com/GetStream/stream-video-js/compare/client0.0.25...client0.0.26) (2023-06-23)


### Features

* Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))

### [0.0.25](https://github.com/GetStream/stream-video-js/compare/client0.0.24...client0.0.25) (2023-06-23)


### Features

* **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))

### [0.0.24](https://github.com/GetStream/stream-video-js/compare/client0.0.23...client0.0.24) (2023-06-23)


### Features

* Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))

### [0.0.23](https://github.com/GetStream/stream-video-js/compare/client0.0.22...client0.0.23) (2023-06-22)


### Bug Fixes

* navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))

### [0.0.22](https://github.com/GetStream/stream-video-js/compare/client0.0.21...client0.0.22) (2023-06-21)


### Documentation

* cleanup ([#679](https://github.com/GetStream/stream-video-js/issues/679)) ([58c86bd](https://github.com/GetStream/stream-video-js/commit/58c86bd0354ebe444af361056dcc3fa82c4a926d))

### [0.0.21](https://github.com/GetStream/stream-video-js/compare/client0.0.20...client0.0.21) (2023-06-21)


### Documentation

* **react-sdk:** update audio rooms tutorial ([#659](https://github.com/GetStream/stream-video-js/issues/659)) ([11f2e80](https://github.com/GetStream/stream-video-js/commit/11f2e8090811fbd8478724b3d2c2c8af3b19a0c5))

### [0.0.20](https://github.com/GetStream/stream-video-js/compare/client0.0.19...client0.0.20) (2023-06-21)


### Bug Fixes

* proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))

### [0.0.19](https://github.com/GetStream/stream-video-js/compare/client0.0.18...client0.0.19) (2023-06-20)


### Bug Fixes

* Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))

### [0.0.18](https://github.com/GetStream/stream-video-js/compare/client0.0.17...client0.0.18) (2023-06-20)


### Features

* Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))

### [0.0.17](https://github.com/GetStream/stream-video-js/compare/client0.0.16...client0.0.17) (2023-06-20)


### Features

* **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))

### [0.0.16](https://github.com/GetStream/stream-video-js/compare/client0.0.15...client0.0.16) (2023-06-16)


### Documentation

* **react-sdk:** Runtime layout switching guide ([#642](https://github.com/GetStream/stream-video-js/issues/642)) ([1557168](https://github.com/GetStream/stream-video-js/commit/1557168da69660b71a0a420a94a0c354466681a7))

### [0.0.15](https://github.com/GetStream/stream-video-js/compare/client0.0.14...client0.0.15) (2023-06-16)


### Features

* Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))

### [0.0.14](https://github.com/GetStream/stream-video-js/compare/client0.0.13...client0.0.14) (2023-06-16)


### Bug Fixes

* **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))

### [0.0.13](https://github.com/GetStream/stream-video-js/compare/client0.0.12...client0.0.13) (2023-06-15)


### Bug Fixes

* do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))

### [0.0.12](https://github.com/GetStream/stream-video-js/compare/client0.0.11...client0.0.12) (2023-06-13)


### Features

* Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))

### [0.0.11](https://github.com/GetStream/stream-video-js/compare/client0.0.10...client0.0.11) (2023-06-13)


### Features

* add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))

### [0.0.10](https://github.com/GetStream/stream-video-js/compare/client0.0.9...client0.0.10) (2023-06-12)


### Features

* User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))

### [0.0.9](https://github.com/GetStream/stream-video-js/compare/client0.0.8...client0.0.9) (2023-06-12)


### Bug Fixes

* prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))

### [0.0.8](https://github.com/GetStream/stream-video-js/compare/client0.0.7...client0.0.8) (2023-06-09)


### Features

* **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))

### [0.0.7](https://github.com/GetStream/stream-video-js/compare/client0.0.6...client0.0.7) (2023-06-08)


### Features

* StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))

### [0.0.6](https://github.com/GetStream/stream-video-js/compare/client0.0.5...client0.0.6) (2023-06-07)


### Features

* Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))

### [0.0.5](https://github.com/GetStream/stream-video-js/compare/client0.0.4...client0.0.5) (2023-06-06)


### Bug Fixes

* adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))

### [0.0.4](https://github.com/GetStream/stream-video-js/compare/client0.0.3...client0.0.4) (2023-06-06)


### Bug Fixes

* use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))

### [0.0.3](https://github.com/GetStream/stream-video-js/compare/client0.0.2...client0.0.3) (2023-06-05)


### Bug Fixes

* preserve last used session-id when reconnecting ([#592](https://github.com/GetStream/stream-video-js/issues/592)) ([25cc9ce](https://github.com/GetStream/stream-video-js/commit/25cc9cef16bcbc505fd0dcc0971ddeab3f07ae50))

### [0.0.2](https://github.com/GetStream/stream-video-js/compare/client0.0.2-alpha.25...client0.0.2) (2023-06-02)
