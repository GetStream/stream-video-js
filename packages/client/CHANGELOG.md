# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

### [1.4.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.0...@stream-io/video-client-1.4.1) (2024-06-19)


### Bug Fixes

* perform full reconnect if ice restart fails ([#1408](https://github.com/GetStream/stream-video-js/issues/1408)) ([641df7e](https://github.com/GetStream/stream-video-js/commit/641df7e50522452171498a9cf3de893472fe7b7b))

## [1.4.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.3.1...@stream-io/video-client-1.4.0) (2024-06-19)


### Features

* **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest struct ([#1397](https://github.com/GetStream/stream-video-js/issues/1397)) ([ded7a23](https://github.com/GetStream/stream-video-js/commit/ded7a23b1d112b496821bee95fe073f57bd51783))

### [1.3.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.3.0...@stream-io/video-client-1.3.1) (2024-06-12)


### Bug Fixes

* add concurrency helpers ([#1392](https://github.com/GetStream/stream-video-js/issues/1392)) ([b87068e](https://github.com/GetStream/stream-video-js/commit/b87068e14d40253a42d0383a4015c52be8f9c03b))

## [1.3.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.2.3...@stream-io/video-client-1.3.0) (2024-06-07)


### Features

* improve `isSupported` method for noise cancellation ([#1388](https://github.com/GetStream/stream-video-js/issues/1388)) ([07031ba](https://github.com/GetStream/stream-video-js/commit/07031ba72443a84cac8856c7481f3d4053b46d4c))

### [1.2.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.2.2...@stream-io/video-client-1.2.3) (2024-06-05)


### Bug Fixes

* catch error for user connect in constructor ([#1390](https://github.com/GetStream/stream-video-js/issues/1390)) ([9a69853](https://github.com/GetStream/stream-video-js/commit/9a69853bac33f70d62224e30a3df5e5383173940))

### [1.2.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.2.1...@stream-io/video-client-1.2.2) (2024-06-04)


### Bug Fixes

* align with the latest openapi ([#1384](https://github.com/GetStream/stream-video-js/issues/1384)) ([7c37e83](https://github.com/GetStream/stream-video-js/commit/7c37e8363ffc7e17e59de8357a2ed769e074bd8d))

### [1.2.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.2.0...@stream-io/video-client-1.2.1) (2024-06-04)


### Bug Fixes

* join doesn't work on chrome 86 ([#1386](https://github.com/GetStream/stream-video-js/issues/1386)) ([7b462da](https://github.com/GetStream/stream-video-js/commit/7b462da8131e086f224c0590221d549a38ba419c))

## [1.2.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.1.0...@stream-io/video-client-1.2.0) (2024-06-03)


### Features

* **client:** support reject reason ([#1369](https://github.com/GetStream/stream-video-js/issues/1369)) ([decfc10](https://github.com/GetStream/stream-video-js/commit/decfc105c68867977c8a9a6484475b805583b446))

## [1.1.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.10...@stream-io/video-client-1.1.0) (2024-06-03)


### Features

* video filters on android ([#1382](https://github.com/GetStream/stream-video-js/issues/1382)) ([7ba8b0e](https://github.com/GetStream/stream-video-js/commit/7ba8b0e3b444869d38aae1a045dffb05444643f5))

### [1.0.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.9...@stream-io/video-client-1.0.10) (2024-05-31)


### Bug Fixes

* improved input device error handling ([#1378](https://github.com/GetStream/stream-video-js/issues/1378)) ([90abc38](https://github.com/GetStream/stream-video-js/commit/90abc38762acc4b8095c281b3b06b1fc8237ec15))

### [1.0.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.8...@stream-io/video-client-1.0.9) (2024-05-29)


### Bug Fixes

* prevent double sound detectors set up ([#1371](https://github.com/GetStream/stream-video-js/issues/1371)) ([51c9198](https://github.com/GetStream/stream-video-js/commit/51c9198a96b956884554bc508e38c90af0cee30f))

### [1.0.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.7...@stream-io/video-client-1.0.8) (2024-05-23)


### Bug Fixes

* call.reject when there is no participant and call is in joined state ([#1366](https://github.com/GetStream/stream-video-js/issues/1366)) ([308d045](https://github.com/GetStream/stream-video-js/commit/308d0452303743922ca1e982bd271b42857d96b3))

### [1.0.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.6...@stream-io/video-client-1.0.7) (2024-05-21)


### Bug Fixes

* align with the latest openapi ([#1343](https://github.com/GetStream/stream-video-js/issues/1343)) ([2cb71cc](https://github.com/GetStream/stream-video-js/commit/2cb71cc599f46e248a4af9b4ea79f5938d7c508c))

### [1.0.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.5...@stream-io/video-client-1.0.6) (2024-05-16)


### Bug Fixes

* **state:** aligns the participant state with other SDKs ([#1357](https://github.com/GetStream/stream-video-js/issues/1357)) ([146e6ac](https://github.com/GetStream/stream-video-js/commit/146e6acd7296488bc18f4bf5c76e9f2c9bfd97af))

### [1.0.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.4...@stream-io/video-client-1.0.5) (2024-05-16)


### Bug Fixes

* correctly handle pending state reset ([4ea47da](https://github.com/GetStream/stream-video-js/commit/4ea47da969f00925e1df144ec2f33cd07ac2f63f))

### [1.0.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.3...@stream-io/video-client-1.0.4) (2024-05-14)


### Bug Fixes

* don't create publisher PC for anonymous users ([#1353](https://github.com/GetStream/stream-video-js/issues/1353)) ([7331767](https://github.com/GetStream/stream-video-js/commit/7331767bd9254082517b1f36895796032b7af149))

### [1.0.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.2...@stream-io/video-client-1.0.3) (2024-05-13)


### Bug Fixes

* improve error handling across the SDK ([#1350](https://github.com/GetStream/stream-video-js/issues/1350)) ([ac0ae3b](https://github.com/GetStream/stream-video-js/commit/ac0ae3b7d5da91152d0f41a203b73e6c99c42ff9))

### [1.0.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.1...@stream-io/video-client-1.0.2) (2024-05-13)


### Bug Fixes

* optimistically toggle device status ([#1342](https://github.com/GetStream/stream-video-js/issues/1342)) ([2e4e470](https://github.com/GetStream/stream-video-js/commit/2e4e470347fce7c7499dd21a931e5dec74bf9618))

### [1.0.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.0...@stream-io/video-client-1.0.1) (2024-05-07)


### Bug Fixes

* **state:** handle participantUpdated event ([#1341](https://github.com/GetStream/stream-video-js/issues/1341)) ([96cb99f](https://github.com/GetStream/stream-video-js/commit/96cb99fe2b661e3f4899a7c16b4159cad7a085c6))

## [1.0.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.8.0...@stream-io/video-client-1.0.0) (2024-05-07)


### Features

* **v1:** release v1.0.0 ([06174cd](https://github.com/GetStream/stream-video-js/commit/06174cdfb4168a7401f56b03d0302f82c97b93ff))

## [0.8.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.13...@stream-io/video-client-0.8.0) (2024-05-07)


### Features

* **v1:** release v1.0.0 ([#1340](https://github.com/GetStream/stream-video-js/issues/1340)) ([f76fd02](https://github.com/GetStream/stream-video-js/commit/f76fd02ec2159bb0943c8432591b462ab0d356ff))

### [0.7.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.12...@stream-io/video-client-0.7.13) (2024-05-07)


### Bug Fixes

* change log level of send stats SFU API to type debug ([#1338](https://github.com/GetStream/stream-video-js/issues/1338)) ([76e43ad](https://github.com/GetStream/stream-video-js/commit/76e43adbff1d54e1b0b5548dabf550cd9044d9dc))

### [0.7.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.11...@stream-io/video-client-0.7.12) (2024-05-03)


### Features

* support target_resolution backend setting for screensharing ([#1336](https://github.com/GetStream/stream-video-js/issues/1336)) ([1e9f796](https://github.com/GetStream/stream-video-js/commit/1e9f7963009ac7fc27ee24abc00eb68749cc19d8))

### [0.7.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.10...@stream-io/video-client-0.7.11) (2024-05-03)


### Bug Fixes

* **devices:** API to disable speaking while muted notifications ([#1335](https://github.com/GetStream/stream-video-js/issues/1335)) ([cdff0e0](https://github.com/GetStream/stream-video-js/commit/cdff0e036bf4afca763e4f7a1563c23e806be190)), closes [#1329](https://github.com/GetStream/stream-video-js/issues/1329)

### [0.7.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.9...@stream-io/video-client-0.7.10) (2024-04-30)


### Bug Fixes

* **state:** optimized Call State updates ([#1330](https://github.com/GetStream/stream-video-js/issues/1330)) ([e5f9f88](https://github.com/GetStream/stream-video-js/commit/e5f9f882df95761bfecbd6b38832f013b0e7a75e))

### [0.7.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.8...@stream-io/video-client-0.7.9) (2024-04-26)


### Bug Fixes

* update call state with transcription events ([ab933ae](https://github.com/GetStream/stream-video-js/commit/ab933aee820fae199935380c7bab6edc7790f0ca))

### [0.7.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.7...@stream-io/video-client-0.7.8) (2024-04-25)


### Features

* Noise Cancellation ([#1321](https://github.com/GetStream/stream-video-js/issues/1321)) ([9144385](https://github.com/GetStream/stream-video-js/commit/91443852986ad7453d82efb900626266d8df0e96))

### [0.7.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.6...@stream-io/video-client-0.7.7) (2024-04-23)


### Features

* **feedback:** Collect user feedback ([#1324](https://github.com/GetStream/stream-video-js/issues/1324)) ([b415de0](https://github.com/GetStream/stream-video-js/commit/b415de0828e402f8d3b854553351843aad2e8473))

### [0.7.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.5...@stream-io/video-client-0.7.6) (2024-04-23)


### Bug Fixes

* **client:** ignore SFU WS status code when the user initiates leaving a call ([#1323](https://github.com/GetStream/stream-video-js/issues/1323)) ([774882b](https://github.com/GetStream/stream-video-js/commit/774882b9e2bb3f3dc72401278c174e1a0f597ce1))

### [0.7.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.4...@stream-io/video-client-0.7.5) (2024-04-23)


### Bug Fixes

* **publisher:** ensure initial bitrate is set ([#1322](https://github.com/GetStream/stream-video-js/issues/1322)) ([d7e8e4e](https://github.com/GetStream/stream-video-js/commit/d7e8e4e5cb3ff9859c1eb580162ed88bbe54b096))

### [0.7.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.3...@stream-io/video-client-0.7.4) (2024-04-17)


### Features

* update from OpenAPI ([#1320](https://github.com/GetStream/stream-video-js/issues/1320)) ([391c030](https://github.com/GetStream/stream-video-js/commit/391c030ba71a2e12001eaa195226dcece44f3922))

### [0.7.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.2...@stream-io/video-client-0.7.3) (2024-04-17)


### Bug Fixes

* **codecs:** Set codec preferences based on receiving capabilities ([#1318](https://github.com/GetStream/stream-video-js/issues/1318)) ([43087fe](https://github.com/GetStream/stream-video-js/commit/43087fed8e844ad9c80a5b4849500eedc8301609))

### [0.7.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.1...@stream-io/video-client-0.7.2) (2024-04-16)


### Features

* update coordinator models ([#1317](https://github.com/GetStream/stream-video-js/issues/1317)) ([cdbee74](https://github.com/GetStream/stream-video-js/commit/cdbee747f1730f6965315e7c9ea9426287ff0cfd))

### [0.7.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.0...@stream-io/video-client-0.7.1) (2024-04-09)


### Features

* user feedback ([#1310](https://github.com/GetStream/stream-video-js/issues/1310)) ([256b775](https://github.com/GetStream/stream-video-js/commit/256b7756e89b261e0efa37952611139bf94a641e))

## [0.7.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.10...@stream-io/video-client-0.7.0) (2024-04-09)


### ⚠ BREAKING CHANGES

* remove server-side capabilities from JS client (#1282)

### Features

* remove server-side capabilities from JS client ([#1282](https://github.com/GetStream/stream-video-js/issues/1282)) ([362b6b5](https://github.com/GetStream/stream-video-js/commit/362b6b501e6aa1864eb8486e3129a1705a4d41fb))

### [0.6.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.9...@stream-io/video-client-0.6.10) (2024-04-05)


### Features

* revert add submit feedback method to Call ([#1307](https://github.com/GetStream/stream-video-js/issues/1307)) ([#1308](https://github.com/GetStream/stream-video-js/issues/1308)) ([df9a74d](https://github.com/GetStream/stream-video-js/commit/df9a74dddf0287812b723d134d92941ac939bb9f))

### [0.6.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.8...@stream-io/video-client-0.6.9) (2024-04-05)


### Features

* add submit feedback method to Call ([#1307](https://github.com/GetStream/stream-video-js/issues/1307)) ([45fb9da](https://github.com/GetStream/stream-video-js/commit/45fb9da6eb52e4509c7b45b53cd62b0af6f7ec74))

### [0.6.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.7...@stream-io/video-client-0.6.8) (2024-04-05)


### Features

* **react:** Support for Background Filters and Background Blurring ([#1283](https://github.com/GetStream/stream-video-js/issues/1283)) ([f790ee7](https://github.com/GetStream/stream-video-js/commit/f790ee78c20fb0f5266e429a777d8bb7ef158c83)), closes [#1271](https://github.com/GetStream/stream-video-js/issues/1271) [#1276](https://github.com/GetStream/stream-video-js/issues/1276)

### [0.6.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.6...@stream-io/video-client-0.6.7) (2024-04-02)


### Features

* [PBE-1611] Query call reports endpoint ([#1306](https://github.com/GetStream/stream-video-js/issues/1306)) ([0861a5d](https://github.com/GetStream/stream-video-js/commit/0861a5dd6e6e56c4ae286c44f174a319e8f308c4))

### [0.6.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.5...@stream-io/video-client-0.6.6) (2024-03-29)


### Features

* **client:** update to the latest OpenAPI ([#1301](https://github.com/GetStream/stream-video-js/issues/1301)) ([f195011](https://github.com/GetStream/stream-video-js/commit/f1950111cde0d9a91e6abd69395c858ac55c624c))

### [0.6.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.4...@stream-io/video-client-0.6.5) (2024-03-29)


### Bug Fixes

* various bug fixes and improvements ([#1300](https://github.com/GetStream/stream-video-js/issues/1300)) ([a6186e2](https://github.com/GetStream/stream-video-js/commit/a6186e2406fd0b3e0aaa51a4222fa2e24e9dfac3))

### [0.6.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.3...@stream-io/video-client-0.6.4) (2024-03-28)


### Bug Fixes

* **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in SDK ([#1299](https://github.com/GetStream/stream-video-js/issues/1299)) ([9527c41](https://github.com/GetStream/stream-video-js/commit/9527c4176d4e46224ddec18e3fddfb404e0aaae5))

### [0.6.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.2...@stream-io/video-client-0.6.3) (2024-03-25)


### Features

* SFU stats reporting ([#1297](https://github.com/GetStream/stream-video-js/issues/1297)) ([f46e927](https://github.com/GetStream/stream-video-js/commit/f46e927cbd650bc9af64a01cd5ebcec6cf2cfda8)), closes [#1276](https://github.com/GetStream/stream-video-js/issues/1276)

### [0.6.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.1...@stream-io/video-client-0.6.2) (2024-03-25)


### Features

* **call:** Add getCallStats method ([#1296](https://github.com/GetStream/stream-video-js/issues/1296)) ([b64a19e](https://github.com/GetStream/stream-video-js/commit/b64a19ecd2fcc74f5f531397ed34732d55b0f815))

### [0.6.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.0...@stream-io/video-client-0.6.1) (2024-03-13)


### Features

* **speakers:** Participant audio output levels ([#1284](https://github.com/GetStream/stream-video-js/issues/1284)) ([63b6077](https://github.com/GetStream/stream-video-js/commit/63b607709fd65019fe320e5970aab8132053995c))

## [0.6.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.11...@stream-io/video-client-0.6.0) (2024-02-26)


### ⚠ BREAKING CHANGES

* **events:** improved type narrowing on call events (#1246)
* **react-sdk:** Visual redesign of the SDK and Demo App (#1194)

### Features

* **events:** improved type narrowing on call events ([#1246](https://github.com/GetStream/stream-video-js/issues/1246)) ([b5bdab1](https://github.com/GetStream/stream-video-js/commit/b5bdab1b526b451402867a849f5790f4f9a9fa1e))
* **react-sdk:** Visual redesign of the SDK and Demo App ([#1194](https://github.com/GetStream/stream-video-js/issues/1194)) ([c1c6a7b](https://github.com/GetStream/stream-video-js/commit/c1c6a7b9bb0551442457f6d0ef5fedc92a985a3d))


### Bug Fixes

* **permissions:** relax device permission handling for Safari ([#1248](https://github.com/GetStream/stream-video-js/issues/1248)) ([39dc231](https://github.com/GetStream/stream-video-js/commit/39dc23175d0c892228b195fc77083d9bc256e1fb))

### [0.5.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.10...@stream-io/video-client-0.5.11) (2024-02-19)


### Bug Fixes

* **client:**  add workaround for missing getConfiguration support in react native webrtc ([#1269](https://github.com/GetStream/stream-video-js/issues/1269)) ([ac163de](https://github.com/GetStream/stream-video-js/commit/ac163de4d89e86b4900c885baef564fdaf6b7bac))

### [0.5.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.9...@stream-io/video-client-0.5.10) (2024-02-16)


### Bug Fixes

* **client:** do not set h264 as preference for iphone ([a014ab0](https://github.com/GetStream/stream-video-js/commit/a014ab0e5e2907d39fac45079d64d12997e2a63e))

### [0.5.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.8...@stream-io/video-client-0.5.9) (2024-02-12)


### Features

* **client:** add stopOnLeave param to device manager ([#1266](https://github.com/GetStream/stream-video-js/issues/1266)) ([2d0a865](https://github.com/GetStream/stream-video-js/commit/2d0a865e1f3d5a72df6bc528eb0ed5e2494eb734)), closes [#1236](https://github.com/GetStream/stream-video-js/issues/1236)

### [0.5.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.7...@stream-io/video-client-0.5.8) (2024-02-06)


### Features

* external storage for recordings ([#1260](https://github.com/GetStream/stream-video-js/issues/1260)) ([50a45fc](https://github.com/GetStream/stream-video-js/commit/50a45fc6b87865f16301d6a9173c59e4774a3b31))

### [0.5.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.6...@stream-io/video-client-0.5.7) (2024-01-29)


### Bug Fixes

* **react-native:** no video stream from ipad ([#1253](https://github.com/GetStream/stream-video-js/issues/1253)) ([3e325ba](https://github.com/GetStream/stream-video-js/commit/3e325ba6063d7452b25bbf88829e2d8155979e6f))

### [0.5.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.5...@stream-io/video-client-0.5.6) (2024-01-19)


### Bug Fixes

* **client:** automatic call join for other participants when someone accepts ([#1247](https://github.com/GetStream/stream-video-js/issues/1247)) ([3559ff2](https://github.com/GetStream/stream-video-js/commit/3559ff209616ccfc4664b24e6a4f35c153be2090)), closes [#1245](https://github.com/GetStream/stream-video-js/issues/1245)

### [0.5.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.4...@stream-io/video-client-0.5.5) (2024-01-16)


### Bug Fixes

* **sfu:** ensure SFU WebSocket is closed ([#1242](https://github.com/GetStream/stream-video-js/issues/1242)) ([3f99206](https://github.com/GetStream/stream-video-js/commit/3f9920616c26770911ebbc54d50dc50f4ca219e2)), closes [#1212](https://github.com/GetStream/stream-video-js/issues/1212)

### [0.5.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.3...@stream-io/video-client-0.5.4) (2024-01-16)


### Bug Fixes

* **ring calls:** cancel auto-drop after rejecting a call ([#1241](https://github.com/GetStream/stream-video-js/issues/1241)) ([67a2aae](https://github.com/GetStream/stream-video-js/commit/67a2aaee658cbe759fbda4d3c924f33e872cd00e))

### [0.5.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.2...@stream-io/video-client-0.5.3) (2023-12-22)


### Features

* Fast Reconnection ([#1220](https://github.com/GetStream/stream-video-js/issues/1220)) ([5673d67](https://github.com/GetStream/stream-video-js/commit/5673d67ecec3b6808450e2892fa93214c26960a8)), closes [#1212](https://github.com/GetStream/stream-video-js/issues/1212)

### [0.5.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.1...@stream-io/video-client-0.5.2) (2023-12-11)


### Bug Fixes

* **ringing:** Auto-Cancel outgoing calls ([#1217](https://github.com/GetStream/stream-video-js/issues/1217)) ([c4d557b](https://github.com/GetStream/stream-video-js/commit/c4d557b736df8ff0a95166d1f9f0a52d4a57a122)), closes [#1215](https://github.com/GetStream/stream-video-js/issues/1215)

### [0.5.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.0...@stream-io/video-client-0.5.1) (2023-12-05)


### Features

* **client:** speaking while muted in React Native using temporary peer connection ([#1207](https://github.com/GetStream/stream-video-js/issues/1207)) ([9093006](https://github.com/GetStream/stream-video-js/commit/90930063503b6dfb83572dad8a31e45b16bf1685))

## [0.5.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.10...@stream-io/video-client-0.5.0) (2023-11-29)


### ⚠ BREAKING CHANGES

* **react-native:** move to webrtc 118 (#1197)

### Features

* **react-native:** move to webrtc 118 ([#1197](https://github.com/GetStream/stream-video-js/issues/1197)) ([8cdbe11](https://github.com/GetStream/stream-video-js/commit/8cdbe11de069fcb6eae5643f5cef5c9612f6c805))

### [0.4.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.9...@stream-io/video-client-0.4.10) (2023-11-27)


### Bug Fixes

* **session:** prevent duplication of session participants ([#1201](https://github.com/GetStream/stream-video-js/issues/1201)) ([2d0131e](https://github.com/GetStream/stream-video-js/commit/2d0131e8f97216b90d873b91282006e428e40ac0))

### [0.4.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.8...@stream-io/video-client-0.4.9) (2023-11-22)


### Features

* **participant-view:** allow opting-out from rendering VideoPlaceholder ([#1198](https://github.com/GetStream/stream-video-js/issues/1198)) ([acb020c](https://github.com/GetStream/stream-video-js/commit/acb020c8157a1338771bef11ef5e501bc9cd6f69))

### [0.4.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.7...@stream-io/video-client-0.4.8) (2023-11-16)


### Bug Fixes

* **device-api:** check for Permissions API availability ([#1193](https://github.com/GetStream/stream-video-js/issues/1193)) ([5ffeaa0](https://github.com/GetStream/stream-video-js/commit/5ffeaa0d2abdab401f9028a14b114d00723605c1)), closes [#1184](https://github.com/GetStream/stream-video-js/issues/1184)

### [0.4.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.6...@stream-io/video-client-0.4.7) (2023-11-13)


### Features

* **device-api:** Browser Permissions API ([#1184](https://github.com/GetStream/stream-video-js/issues/1184)) ([a0b3573](https://github.com/GetStream/stream-video-js/commit/a0b3573b630ff8450953cdf1102fe722aea83f6f))

### [0.4.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.5...@stream-io/video-client-0.4.6) (2023-11-13)


### Features

* handle device disconnection ([#1174](https://github.com/GetStream/stream-video-js/issues/1174)) ([ae3779f](https://github.com/GetStream/stream-video-js/commit/ae3779fbfd820d8ef85ad58dafb698e06c00a3e3))

### [0.4.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.4...@stream-io/video-client-0.4.5) (2023-11-07)


### Bug Fixes

* lift the debug helpers from the SDK to Pronto ([#1182](https://github.com/GetStream/stream-video-js/issues/1182)) ([8f31efc](https://github.com/GetStream/stream-video-js/commit/8f31efc71d9f85ef147d21b42f23876599c36072))

### [0.4.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.3...@stream-io/video-client-0.4.4) (2023-11-02)


### Bug Fixes

* allow audio and screen share audio tracks, delay setSinkId ([#1176](https://github.com/GetStream/stream-video-js/issues/1176)) ([6a099c5](https://github.com/GetStream/stream-video-js/commit/6a099c5c7cc6f5d389961a7c594e914e19be4ddb))

### [0.4.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.2...@stream-io/video-client-0.4.3) (2023-11-01)


### Bug Fixes

* **client:** optimized device enumeration ([#1111](https://github.com/GetStream/stream-video-js/issues/1111)) ([435bd33](https://github.com/GetStream/stream-video-js/commit/435bd33afbe8b368413690f8f2d67d0b4918dbaa))

### [0.4.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.1...@stream-io/video-client-0.4.2) (2023-11-01)


### Bug Fixes

* respect server-side settings in the lobby ([#1175](https://github.com/GetStream/stream-video-js/issues/1175)) ([b722a0a](https://github.com/GetStream/stream-video-js/commit/b722a0a4f8fd4e4e56787db3d9a56e45ee195974))

### [0.4.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.0...@stream-io/video-client-0.4.1) (2023-10-30)


### Features

* Apply device config settings when call state becomes available ([#1167](https://github.com/GetStream/stream-video-js/issues/1167)) ([38e8ba4](https://github.com/GetStream/stream-video-js/commit/38e8ba459b60d9705af96ad7b9a2a7fa1827ad1e))

## [0.4.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.36...@stream-io/video-client-0.4.0) (2023-10-27)


### ⚠ BREAKING CHANGES

* **react-sdk:** Universal Device Management API (#1127)

### Features

* **react-sdk:** Universal Device Management API ([#1127](https://github.com/GetStream/stream-video-js/issues/1127)) ([aeb3561](https://github.com/GetStream/stream-video-js/commit/aeb35612745f45254b536281c5f81d1bcac2bab5))

### [0.3.36](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.35...@stream-io/video-client-0.3.36) (2023-10-25)


### Features

* **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality message ([#1113](https://github.com/GetStream/stream-video-js/issues/1113)) ([81b91d4](https://github.com/GetStream/stream-video-js/commit/81b91d48ca90a74f6af4b879c553ff2575dcb5bb))

### [0.3.35](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.34...@stream-io/video-client-0.3.35) (2023-10-19)


### Features

* mute screenshare_audio, update to the newest OpenAPI schema ([#1148](https://github.com/GetStream/stream-video-js/issues/1148)) ([81c45a7](https://github.com/GetStream/stream-video-js/commit/81c45a77e6a526de05ce5457357d212fb3e613d9))

### [0.3.34](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.33...@stream-io/video-client-0.3.34) (2023-10-18)


### Features

* **build:** ESM and CJS bundles ([#1144](https://github.com/GetStream/stream-video-js/issues/1144)) ([58b60ee](https://github.com/GetStream/stream-video-js/commit/58b60eee4b1cd667d2eef8f17ed4e6da74876a51)), closes [#1025](https://github.com/GetStream/stream-video-js/issues/1025)

### [0.3.33](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.32...@stream-io/video-client-0.3.33) (2023-10-13)


### Bug Fixes

* **client:** disable server side tests ([#1143](https://github.com/GetStream/stream-video-js/issues/1143)) ([68043f3](https://github.com/GetStream/stream-video-js/commit/68043f35630a94f0097dafcee74afe67e1e6054f))

### [0.3.32](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.31...@stream-io/video-client-0.3.32) (2023-10-13)


### Bug Fixes

* **client:** skip broken update call types test ([#1142](https://github.com/GetStream/stream-video-js/issues/1142)) ([e1d5837](https://github.com/GetStream/stream-video-js/commit/e1d5837140b19398a42b9c57b6b6bbfafd52bc21))

### [0.3.31](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.30...@stream-io/video-client-0.3.31) (2023-10-09)


### Bug Fixes

* sorting in paginated grid ([#1129](https://github.com/GetStream/stream-video-js/issues/1129)) ([d5b280a](https://github.com/GetStream/stream-video-js/commit/d5b280aadeaa4c718d0158561197c7045620ae0f))

### [0.3.30](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.29...@stream-io/video-client-0.3.30) (2023-10-06)


### Features

* ScreenShare Audio support ([#1118](https://github.com/GetStream/stream-video-js/issues/1118)) ([5b63e1c](https://github.com/GetStream/stream-video-js/commit/5b63e1c5f52c76e3761e6907bd3786c19f0e5c6d))

### [0.3.29](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.28...@stream-io/video-client-0.3.29) (2023-10-05)


### Bug Fixes

* ensure stable sort ([#1130](https://github.com/GetStream/stream-video-js/issues/1130)) ([f96e1af](https://github.com/GetStream/stream-video-js/commit/f96e1af33ef9e60434e07dc0fba5161f20b8eba6))

### [0.3.28](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.27...@stream-io/video-client-0.3.28) (2023-09-28)


### Bug Fixes

* use `@stream-io/video-client` as a tag prefix ([#1116](https://github.com/GetStream/stream-video-js/issues/1116)) ([418206a](https://github.com/GetStream/stream-video-js/commit/418206aaa3a013e0d551e109d8243e75a053d5a3))

### [0.3.27](https://github.com/GetStream/stream-video-js/compare/client0.3.26...client0.3.27) (2023-09-28)


### Bug Fixes

* use `@types/ws` as a regular dependency ([#1115](https://github.com/GetStream/stream-video-js/issues/1115)) ([bafad33](https://github.com/GetStream/stream-video-js/commit/bafad3317b7b899b4f2a6a3fdf3b051ad4c96c34))

### [0.3.26](https://github.com/GetStream/stream-video-js/compare/client0.3.25...client0.3.26) (2023-09-27)


### Features

* **Call Preview:** Support for call thumbnails ([#1099](https://github.com/GetStream/stream-video-js/issues/1099)) ([9274f76](https://github.com/GetStream/stream-video-js/commit/9274f760ed264ee0ee6ac97c6fe679288e067fd8))

### [0.3.25](https://github.com/GetStream/stream-video-js/compare/client0.3.24...client0.3.25) (2023-09-27)


### Features

* **react-sdk:** LivestreamLayout ([#1103](https://github.com/GetStream/stream-video-js/issues/1103)) ([6636699](https://github.com/GetStream/stream-video-js/commit/6636699701dfd5eb5886c50781dd5f16a8470da5))

### [0.3.24](https://github.com/GetStream/stream-video-js/compare/client0.3.23...client0.3.24) (2023-09-26)


### Features

* **client:** share replay of computed observables ([#1095](https://github.com/GetStream/stream-video-js/issues/1095)) ([759d9a2](https://github.com/GetStream/stream-video-js/commit/759d9a2c403aa11a64e5470aa53622022918e24e))

### [0.3.23](https://github.com/GetStream/stream-video-js/compare/client0.3.22...client0.3.23) (2023-09-26)


### Bug Fixes

* add type check of deviceId before setting sinkId ([#1108](https://github.com/GetStream/stream-video-js/issues/1108)) ([705515e](https://github.com/GetStream/stream-video-js/commit/705515e5f63a35286fdb45725b9e299afe09c9bb))

### [0.3.22](https://github.com/GetStream/stream-video-js/compare/client0.3.21...client0.3.22) (2023-09-25)


### Bug Fixes

* Add extra delay before attempting to play video in Safari and Firefox ([#1106](https://github.com/GetStream/stream-video-js/issues/1106)) ([5b4a589](https://github.com/GetStream/stream-video-js/commit/5b4a58918240a7b63807726609d6d54b92cfe1d2))

### [0.3.21](https://github.com/GetStream/stream-video-js/compare/client0.3.20...client0.3.21) (2023-09-20)


### Bug Fixes

* unmount video element when there is no video track or participant is invisible ([#1096](https://github.com/GetStream/stream-video-js/issues/1096)) ([bd01835](https://github.com/GetStream/stream-video-js/commit/bd01835f4e93c981ca2e5a7e4e09142ea4e326cf)), closes [#1094](https://github.com/GetStream/stream-video-js/issues/1094)

### [0.3.20](https://github.com/GetStream/stream-video-js/compare/client0.3.19...client0.3.20) (2023-09-19)


### Features

* Update with new API spec ([#1098](https://github.com/GetStream/stream-video-js/issues/1098)) ([ced372c](https://github.com/GetStream/stream-video-js/commit/ced372ca068086375024d59a977014efcadefef2))

### [0.3.19](https://github.com/GetStream/stream-video-js/compare/client0.3.18...client0.3.19) (2023-09-15)


### Bug Fixes

* initial device state handling ([#1092](https://github.com/GetStream/stream-video-js/issues/1092)) ([a98d07f](https://github.com/GetStream/stream-video-js/commit/a98d07f9e3eaf6bb059911538ba2a64a1550e53d))

### [0.3.18](https://github.com/GetStream/stream-video-js/compare/client0.3.17...client0.3.18) (2023-09-15)


### Bug Fixes

* **DynascaleManager:** update subscription upon cleanup ([#1089](https://github.com/GetStream/stream-video-js/issues/1089)) ([bad8ac1](https://github.com/GetStream/stream-video-js/commit/bad8ac1651594b237b96987521000008753a80a5))

### [0.3.17](https://github.com/GetStream/stream-video-js/compare/client0.3.16...client0.3.17) (2023-09-14)


### Features

* speaking while muted notification ([#1011](https://github.com/GetStream/stream-video-js/issues/1011)) ([b17600c](https://github.com/GetStream/stream-video-js/commit/b17600c626a55f1ef4c7abacab6e02d38e3263b7))

### [0.3.16](https://github.com/GetStream/stream-video-js/compare/client0.3.15...client0.3.16) (2023-09-13)


### Features

* restore remote muting functionality ([#1078](https://github.com/GetStream/stream-video-js/issues/1078)) ([091d444](https://github.com/GetStream/stream-video-js/commit/091d4440a423e5f265e6fd6b1ceea32a447de93a)), closes [#1070](https://github.com/GetStream/stream-video-js/issues/1070) [#988](https://github.com/GetStream/stream-video-js/issues/988)

### [0.3.15](https://github.com/GetStream/stream-video-js/compare/client0.3.14...client0.3.15) (2023-09-11)


### Bug Fixes

* consider prior track publishing state before applying soft mutes ([#1070](https://github.com/GetStream/stream-video-js/issues/1070)) ([f542409](https://github.com/GetStream/stream-video-js/commit/f542409c641417bbbe6f0997d77e34684b881bfb)), closes [#988](https://github.com/GetStream/stream-video-js/issues/988)

### [0.3.14](https://github.com/GetStream/stream-video-js/compare/client0.3.13...client0.3.14) (2023-09-05)


### Features

* new device api remote mutes ([#988](https://github.com/GetStream/stream-video-js/issues/988)) ([5bbcefb](https://github.com/GetStream/stream-video-js/commit/5bbcefbf0d8be59025fef8111253a8a0baaf6001))

### [0.3.13](https://github.com/GetStream/stream-video-js/compare/client0.3.12...client0.3.13) (2023-08-31)


### Features

* speaker management ([#1013](https://github.com/GetStream/stream-video-js/issues/1013)) ([05af437](https://github.com/GetStream/stream-video-js/commit/05af437181175758c3295fbd70ae6d81d6c65595))

### [0.3.12](https://github.com/GetStream/stream-video-js/compare/client0.3.11...client0.3.12) (2023-08-31)


### Bug Fixes

* do not do any codec preferences when sending dummy sdp ([#1028](https://github.com/GetStream/stream-video-js/issues/1028)) ([3910619](https://github.com/GetStream/stream-video-js/commit/391061902ab71571e2910a0ebdfeb02e8bfd390a))

### [0.3.11](https://github.com/GetStream/stream-video-js/compare/client0.3.10...client0.3.11) (2023-08-30)


### Bug Fixes

* **react-native:** blank stream on join ([#1022](https://github.com/GetStream/stream-video-js/issues/1022)) ([d5a48f6](https://github.com/GetStream/stream-video-js/commit/d5a48f6e75bf4e1b5c0745b7f0b001fd0ac4b183))

### [0.3.10](https://github.com/GetStream/stream-video-js/compare/client0.3.9...client0.3.10) (2023-08-30)


### Features

* **Call:** Dynascale support for Plain-JS SDK ([#914](https://github.com/GetStream/stream-video-js/issues/914)) ([d295fd3](https://github.com/GetStream/stream-video-js/commit/d295fd341bbe325310fc6479f24ef647b013429b))

### [0.3.9](https://github.com/GetStream/stream-video-js/compare/client0.3.8...client0.3.9) (2023-08-29)


### Bug Fixes

* round non-int video dimension values ([#1007](https://github.com/GetStream/stream-video-js/issues/1007)) ([baec0b5](https://github.com/GetStream/stream-video-js/commit/baec0b5d4d2242e71c413e93b73897589e31429c))

### [0.3.8](https://github.com/GetStream/stream-video-js/compare/client0.3.7...client0.3.8) (2023-08-29)


### Bug Fixes

* type definition of user object for ws auth ([#1003](https://github.com/GetStream/stream-video-js/issues/1003)) ([e0ed3d1](https://github.com/GetStream/stream-video-js/commit/e0ed3d17214e9a300d84c85a0e168ad4a7d16239))

### [0.3.7](https://github.com/GetStream/stream-video-js/compare/client0.3.6...client0.3.7) (2023-08-24)


### Features

* apply target resolution to video feed, sync camera/mic init ([#977](https://github.com/GetStream/stream-video-js/issues/977)) ([8ee6488](https://github.com/GetStream/stream-video-js/commit/8ee64882ebd4911445242beef5fd3148372283e3))

### [0.3.6](https://github.com/GetStream/stream-video-js/compare/client0.3.5...client0.3.6) (2023-08-23)


### Bug Fixes

* device api small fixes ([#970](https://github.com/GetStream/stream-video-js/issues/970)) ([15b09fd](https://github.com/GetStream/stream-video-js/commit/15b09fd5e1d25046f8e2cbaa951f551631a91779))

### [0.3.5](https://github.com/GetStream/stream-video-js/compare/client0.3.4...client0.3.5) (2023-08-22)


### Bug Fixes

* Change the backtage default value to true ([#969](https://github.com/GetStream/stream-video-js/issues/969)) ([5aff8b4](https://github.com/GetStream/stream-video-js/commit/5aff8b4695373de660d625a4945e300d1ff90610))

### [0.3.4](https://github.com/GetStream/stream-video-js/compare/client0.3.3...client0.3.4) (2023-08-21)


### Bug Fixes

* guest auth didn't wait for some API calls ([#965](https://github.com/GetStream/stream-video-js/issues/965)) ([5d9e1c6](https://github.com/GetStream/stream-video-js/commit/5d9e1c6ebb09901a8f3e12c435736e0640af62dc))

### [0.3.3](https://github.com/GetStream/stream-video-js/compare/client0.3.2...client0.3.3) (2023-08-18)


### Features

* Disable doesn't stop audio tracks ([#950](https://github.com/GetStream/stream-video-js/issues/950)) ([c348f34](https://github.com/GetStream/stream-video-js/commit/c348f34818f0e123e70b9471637ddd64411ebc08))

### [0.3.2](https://github.com/GetStream/stream-video-js/compare/client0.3.1...client0.3.2) (2023-08-16)


### Features

* use new device API in RN SDK and move to @stream-io/react-native-webrtc ([#925](https://github.com/GetStream/stream-video-js/issues/925)) ([8442d82](https://github.com/GetStream/stream-video-js/commit/8442d821a8eb97cb4be6e6d71b64337c04a86a15))


### Bug Fixes

* **client:** export missing classes ([#943](https://github.com/GetStream/stream-video-js/issues/943)) ([2964eb1](https://github.com/GetStream/stream-video-js/commit/2964eb16c405b7b7020ef9bfda81183f28e40b6b))

### [0.3.1](https://github.com/GetStream/stream-video-js/compare/client0.3.0...client0.3.1) (2023-08-16)


### Features

* New device API v1 ([#908](https://github.com/GetStream/stream-video-js/issues/908)) ([82ec41d](https://github.com/GetStream/stream-video-js/commit/82ec41da16bd9d1aa8d51e6eb9a16ce3f70e549b))

## [0.3.0](https://github.com/GetStream/stream-video-js/compare/client0.2.3...client0.3.0) (2023-08-16)


### ⚠ BREAKING CHANGES

* Call State reorganization (#931)

### Features

* Call State reorganization ([#931](https://github.com/GetStream/stream-video-js/issues/931)) ([441dbd4](https://github.com/GetStream/stream-video-js/commit/441dbd4ffb8c851abb0ca719be143a1e80d1418c)), closes [#917](https://github.com/GetStream/stream-video-js/issues/917)

### [0.2.3](https://github.com/GetStream/stream-video-js/compare/client0.2.2...client0.2.3) (2023-08-14)


### Features

* extra config params in goLive() API ([#924](https://github.com/GetStream/stream-video-js/issues/924)) ([e14a082](https://github.com/GetStream/stream-video-js/commit/e14a0829460a3c5ff6d249dd159e6118df0b8352))

### [0.2.2](https://github.com/GetStream/stream-video-js/compare/client0.2.1...client0.2.2) (2023-08-08)


### Features

* **livestream:** Livestream tutorial rewrite ([#909](https://github.com/GetStream/stream-video-js/issues/909)) ([49efdaa](https://github.com/GetStream/stream-video-js/commit/49efdaa14faccaa4848e8f9bdf3abb7748b925ac))

### [0.2.1](https://github.com/GetStream/stream-video-js/compare/client0.2.0...client0.2.1) (2023-08-07)


### Features

* enhanced call session ([#900](https://github.com/GetStream/stream-video-js/issues/900)) ([dd4f1ea](https://github.com/GetStream/stream-video-js/commit/dd4f1ea03dbab0661a8b79dd55f51b0e9477ae75))

## [0.2.0](https://github.com/GetStream/stream-video-js/compare/client0.1.11...client0.2.0) (2023-08-07)


### ⚠ BREAKING CHANGES

* Server-side participant pinning (#881)

### Features

* Server-side participant pinning ([#881](https://github.com/GetStream/stream-video-js/issues/881)) ([72829f1](https://github.com/GetStream/stream-video-js/commit/72829f1caf5b9c719d063a7e5175b7aa7431cd71))

### [0.1.11](https://github.com/GetStream/stream-video-js/compare/client0.1.10...client0.1.11) (2023-08-04)


### Bug Fixes

* update subscriptions when restoring connection ([#898](https://github.com/GetStream/stream-video-js/issues/898)) ([55e78c7](https://github.com/GetStream/stream-video-js/commit/55e78c77df5dfa22a4068ad40eb5aeb8a6a9fa8a))

### [0.1.10](https://github.com/GetStream/stream-video-js/compare/client0.1.9...client0.1.10) (2023-08-01)


### Features

* **client:** Create state shortcut for client state store ([#888](https://github.com/GetStream/stream-video-js/issues/888)) ([799c90d](https://github.com/GetStream/stream-video-js/commit/799c90d7a22fc90b497493764916e3f620a1481b))

### [0.1.9](https://github.com/GetStream/stream-video-js/compare/client0.1.8...client0.1.9) (2023-07-28)


### Bug Fixes

* set initial device state regardless of call state ([#869](https://github.com/GetStream/stream-video-js/issues/869)) ([3c3cb29](https://github.com/GetStream/stream-video-js/commit/3c3cb29e5585e30b0eacc4b0ecb7bab2e075c111))

### [0.1.8](https://github.com/GetStream/stream-video-js/compare/client0.1.7...client0.1.8) (2023-07-27)


### Features

* Add call.create ([#862](https://github.com/GetStream/stream-video-js/issues/862)) ([6d07d0b](https://github.com/GetStream/stream-video-js/commit/6d07d0b5248b6339b4ee95af90dba4c4e1f5c5db))

### [0.1.7](https://github.com/GetStream/stream-video-js/compare/client0.1.6...client0.1.7) (2023-07-26)


### Features

* support goLive({ notify: true }) ([#848](https://github.com/GetStream/stream-video-js/issues/848)) ([ed67b28](https://github.com/GetStream/stream-video-js/commit/ed67b280082e91e356ee7c0063f2dafab6f8e0c2))

### [0.1.6](https://github.com/GetStream/stream-video-js/compare/client0.1.5...client0.1.6) (2023-07-26)


### Documentation

* Readme for js client, contributing guide ([#858](https://github.com/GetStream/stream-video-js/issues/858)) ([4d25c90](https://github.com/GetStream/stream-video-js/commit/4d25c909d2db3c5f98f89ad37dd810fc4ab7cc95))

### [0.1.5](https://github.com/GetStream/stream-video-js/compare/client0.1.4...client0.1.5) (2023-07-21)


### Bug Fixes

* strict mode issue ([#740](https://github.com/GetStream/stream-video-js/issues/740)) ([c39e4e4](https://github.com/GetStream/stream-video-js/commit/c39e4e4041a2326393478ad808b2aa791d50f8ce))

### [0.1.4](https://github.com/GetStream/stream-video-js/compare/client0.1.3...client0.1.4) (2023-07-21)


### Features

* ICE Restarts ([#814](https://github.com/GetStream/stream-video-js/issues/814)) ([a03f8cd](https://github.com/GetStream/stream-video-js/commit/a03f8cd8cc90f91fb67c4c80e097eed64ca67715))


### Bug Fixes

* shorter thresholds for ICE restarts ([#839](https://github.com/GetStream/stream-video-js/issues/839)) ([fe2bbe5](https://github.com/GetStream/stream-video-js/commit/fe2bbe5687a26e01983273d8c25016689c6f1584)), closes [#814](https://github.com/GetStream/stream-video-js/issues/814)

### [0.1.3](https://github.com/GetStream/stream-video-js/compare/client0.1.2...client0.1.3) (2023-07-20)


### Bug Fixes

* server side user connect + add tests ([#825](https://github.com/GetStream/stream-video-js/issues/825)) ([95ea24d](https://github.com/GetStream/stream-video-js/commit/95ea24d03306d1b25c3c5af042a202a7b551d865))

### [0.1.2](https://github.com/GetStream/stream-video-js/compare/client0.1.1...client0.1.2) (2023-07-19)


### Features

* server-side client ([#815](https://github.com/GetStream/stream-video-js/issues/815)) ([c3bc445](https://github.com/GetStream/stream-video-js/commit/c3bc445c7db68965934c3e72f005ff7e949e9328))

### [0.1.1](https://github.com/GetStream/stream-video-js/compare/client0.1.0...client0.1.1) (2023-07-18)


### Features

* **sessions:** update to the new call.session event models ([#806](https://github.com/GetStream/stream-video-js/issues/806)) ([2966837](https://github.com/GetStream/stream-video-js/commit/296683789823a8dd12e99193f6baaf971824ae83))

## [0.1.0](https://github.com/GetStream/stream-video-js/compare/client0.0.51...client0.1.0) (2023-07-17)


### ⚠ BREAKING CHANGES

* Trigger breaking change for client

### Features

* Trigger breaking change for client ([5230bfb](https://github.com/GetStream/stream-video-js/commit/5230bfb5cea4776f78fd9ae73cdeb5a0ea27c7fd))

### [0.0.51](https://github.com/GetStream/stream-video-js/compare/client0.0.50...client0.0.51) (2023-07-17)

### Features

- Update readme ([9e172f3](https://github.com/GetStream/stream-video-js/commit/9e172f3f72c4da6b24bb19193f70896435c50877))

### [0.0.50](https://github.com/GetStream/stream-video-js/compare/client0.0.49...client0.0.50) (2023-07-17)

### Bug Fixes

- Update README.md ([1e62478](https://github.com/GetStream/stream-video-js/commit/1e624782f97c36dd745f00fb56a2ded4e1dffa35))

### [0.0.49](https://github.com/GetStream/stream-video-js/compare/client0.0.48...client0.0.49) (2023-07-17)

### Bug Fixes

- promote prop-types to a 'dependency' in react-sdk ([#805](https://github.com/GetStream/stream-video-js/issues/805)) ([7109c9b](https://github.com/GetStream/stream-video-js/commit/7109c9b6d4087789f44ab8beb539bca495ba8f76))

### [0.0.48](https://github.com/GetStream/stream-video-js/compare/client0.0.47...client0.0.48) (2023-07-14)

### Bug Fixes

- force iceRestart offer, delay ICE restart ([#801](https://github.com/GetStream/stream-video-js/issues/801)) ([0da298f](https://github.com/GetStream/stream-video-js/commit/0da298faff30ddc42277444aad0d40a635fafb0b)), closes [#787](https://github.com/GetStream/stream-video-js/issues/787)

### [0.0.47](https://github.com/GetStream/stream-video-js/compare/client0.0.46...client0.0.47) (2023-07-14)

### Features

- take the location-hint on SDK init ([#799](https://github.com/GetStream/stream-video-js/issues/799)) ([ee5b170](https://github.com/GetStream/stream-video-js/commit/ee5b170337278a7063a368790f46b270647abf71))

### [0.0.46](https://github.com/GetStream/stream-video-js/compare/client0.0.45...client0.0.46) (2023-07-14)

### Bug Fixes

- version.ts override ([4238936](https://github.com/GetStream/stream-video-js/commit/4238936ec5d24c4ec1ce2147eb4ac2d7b74935ca))

### [0.0.45](https://github.com/GetStream/stream-video-js/compare/client0.0.44...client0.0.45) (2023-07-14)

### Features

- fix version problem ([096425b](https://github.com/GetStream/stream-video-js/commit/096425bbcb6fcc06a566458dc6bd8431183d31d8))

### [0.0.44](https://github.com/GetStream/stream-video-js/compare/client0.0.43...client0.0.44) (2023-07-14)

### Features

- SDK version header ([#790](https://github.com/GetStream/stream-video-js/issues/790)) ([6c662db](https://github.com/GetStream/stream-video-js/commit/6c662db59321db4060b5499d8eaad8a18b1eaf6c))

### [0.0.43](https://github.com/GetStream/stream-video-js/compare/client0.0.42...client0.0.43) (2023-07-12)

### Bug Fixes

- Attempt to recover Publisher PeerConnection ([#787](https://github.com/GetStream/stream-video-js/issues/787)) ([0ac2b58](https://github.com/GetStream/stream-video-js/commit/0ac2b5834fba01c01a5d7d0589ce42a5940643af))

### [0.0.42](https://github.com/GetStream/stream-video-js/compare/client0.0.41...client0.0.42) (2023-07-12)

### Bug Fixes

- Heuristic announcement of track mid ([#785](https://github.com/GetStream/stream-video-js/issues/785)) ([21c1da7](https://github.com/GetStream/stream-video-js/commit/21c1da74a7b1691ccea6cad360dd9e18fa357b2d))

### [0.0.41](https://github.com/GetStream/stream-video-js/compare/client0.0.40...client0.0.41) (2023-07-10)

### Documentation

- **react-sdk:** add token snippet to audio rooms tutorial ([#739](https://github.com/GetStream/stream-video-js/issues/739)) ([bf0b46c](https://github.com/GetStream/stream-video-js/commit/bf0b46ce40329458ad545c82b70a4099c4afc8f2))

### [0.0.40](https://github.com/GetStream/stream-video-js/compare/client0.0.39...client0.0.40) (2023-07-07)

### Features

- reconnection flow support for react-native ([#746](https://github.com/GetStream/stream-video-js/issues/746)) ([8677317](https://github.com/GetStream/stream-video-js/commit/86773172cd6e9c77940645302cc80b138ecc090a))

### [0.0.39](https://github.com/GetStream/stream-video-js/compare/client0.0.38...client0.0.39) (2023-07-07)

### Bug Fixes

- promise rejection on call leave ([#767](https://github.com/GetStream/stream-video-js/issues/767)) ([4b9fb95](https://github.com/GetStream/stream-video-js/commit/4b9fb959649126594855a1699058da907d7b5832))

### [0.0.38](https://github.com/GetStream/stream-video-js/compare/client0.0.37...client0.0.38) (2023-07-07)

### Features

- respect user_session_id in call.session events ([#766](https://github.com/GetStream/stream-video-js/issues/766)) ([18c6ae0](https://github.com/GetStream/stream-video-js/commit/18c6ae0ea47060e18b3462c7a6a04cad59f5f94b))

### [0.0.37](https://github.com/GetStream/stream-video-js/compare/client0.0.36...client0.0.37) (2023-07-06)

### Features

- Remove ringing flag from call client ([#755](https://github.com/GetStream/stream-video-js/issues/755)) ([b78c605](https://github.com/GetStream/stream-video-js/commit/b78c60500e06b39fb4dce623bde6f7b10acdd8c1)), closes [/github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt#L82](https://github.com/GetStream//github.com/GetStream/stream-video-android/blob/develop/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/notifications/internal/VideoPushDelegate.kt/issues/L82)

### Bug Fixes

- restore CallUserMuted event ([#759](https://github.com/GetStream/stream-video-js/issues/759)) ([caf43bb](https://github.com/GetStream/stream-video-js/commit/caf43bb0a8246aeb9c94ea2e0cc3d32e9a43fef1))

### [0.0.36](https://github.com/GetStream/stream-video-js/compare/client0.0.35...client0.0.36) (2023-07-05)

### Bug Fixes

- wait for connection ok for all API requests ([#752](https://github.com/GetStream/stream-video-js/issues/752)) ([82f441d](https://github.com/GetStream/stream-video-js/commit/82f441d5fb84ddc2c16fb97ca362e05fff78b4dd))

### [0.0.35](https://github.com/GetStream/stream-video-js/compare/client0.0.34...client0.0.35) (2023-07-05)

### Bug Fixes

- Reliable mid detection ([#753](https://github.com/GetStream/stream-video-js/issues/753)) ([d602574](https://github.com/GetStream/stream-video-js/commit/d6025740f46db413b5c040cb9af145cfa9be4bf1))

### [0.0.34](https://github.com/GetStream/stream-video-js/compare/client0.0.33...client0.0.34) (2023-07-05)

### Bug Fixes

- prevent double publishStream invocation ([#749](https://github.com/GetStream/stream-video-js/issues/749)) ([9e3c22f](https://github.com/GetStream/stream-video-js/commit/9e3c22fd37d8dc00d275e8b69f9cd18f67e366fe))

### [0.0.33](https://github.com/GetStream/stream-video-js/compare/client0.0.32...client0.0.33) (2023-07-04)

### [0.0.32](https://github.com/GetStream/stream-video-js/compare/client0.0.31...client0.0.32) (2023-07-04)

### Features

- stop tracking permission requests in Call state ([#744](https://github.com/GetStream/stream-video-js/issues/744)) ([b330df3](https://github.com/GetStream/stream-video-js/commit/b330df39d9dce34d9e5a1a7ec58acb0a905ee07b))

### [0.0.31](https://github.com/GetStream/stream-video-js/compare/client0.0.30...client0.0.31) (2023-07-03)

### Bug Fixes

- safeguard against potential race conditions during join-flow ([#741](https://github.com/GetStream/stream-video-js/issues/741)) ([54f1ef6](https://github.com/GetStream/stream-video-js/commit/54f1ef636d3c46b29c538a8c2c7bc5031fde43c9))

### [0.0.30](https://github.com/GetStream/stream-video-js/compare/client0.0.29...client0.0.30) (2023-07-03)

### Bug Fixes

- dont use window search in react native ([4883512](https://github.com/GetStream/stream-video-js/commit/4883512692bf6626b5ac9df6e80384843ec0917d))

### [0.0.29](https://github.com/GetStream/stream-video-js/compare/client0.0.28...client0.0.29) (2023-07-03)

### Features

- SFU Session Migration and Graceful Shutdown ([#603](https://github.com/GetStream/stream-video-js/issues/603)) ([943169b](https://github.com/GetStream/stream-video-js/commit/943169bd2b7b9e138bcaf387cf72eb3fa0f23533))

### [0.0.28](https://github.com/GetStream/stream-video-js/compare/client0.0.27...client0.0.28) (2023-06-29)

### Features

- Change sendEvent signature ([#734](https://github.com/GetStream/stream-video-js/issues/734)) ([284c8c2](https://github.com/GetStream/stream-video-js/commit/284c8c2165129852ccf9fd7d8baad37f43d22a17))

### [0.0.27](https://github.com/GetStream/stream-video-js/compare/client0.0.26...client0.0.27) (2023-06-27)

### Documentation

- Tutorial rewrite ([#709](https://github.com/GetStream/stream-video-js/issues/709)) ([9a14188](https://github.com/GetStream/stream-video-js/commit/9a141883ec2e402e7130c7e41f464439d5cb2800))

### [0.0.26](https://github.com/GetStream/stream-video-js/compare/client0.0.25...client0.0.26) (2023-06-23)

### Features

- Add user that mutes others in `CallUserMuted` event ([#704](https://github.com/GetStream/stream-video-js/issues/704)) ([f57fbbd](https://github.com/GetStream/stream-video-js/commit/f57fbbdcf9002add174aceba191211f3884cdc62))

### [0.0.25](https://github.com/GetStream/stream-video-js/compare/client0.0.24...client0.0.25) (2023-06-23)

### Features

- **react-native:** send device and os info from the SDK ([#690](https://github.com/GetStream/stream-video-js/issues/690)) ([deb1a28](https://github.com/GetStream/stream-video-js/commit/deb1a28a4a029d988d11970608f00da8b327a02d))

### [0.0.24](https://github.com/GetStream/stream-video-js/compare/client0.0.23...client0.0.24) (2023-06-23)

### Features

- Add `CallUserMuted` event ([#699](https://github.com/GetStream/stream-video-js/issues/699)) ([41a09e2](https://github.com/GetStream/stream-video-js/commit/41a09e257a9a8cd9b1b45551f35cebb3cd7a048b))

### [0.0.23](https://github.com/GetStream/stream-video-js/compare/client0.0.22...client0.0.23) (2023-06-22)

### Bug Fixes

- navigate to incoming call screen when push notification is tapped ([#697](https://github.com/GetStream/stream-video-js/issues/697)) ([85488a2](https://github.com/GetStream/stream-video-js/commit/85488a213abb0482c7aedefb5c3aa999131c746a))

### [0.0.22](https://github.com/GetStream/stream-video-js/compare/client0.0.21...client0.0.22) (2023-06-21)

### Documentation

- cleanup ([#679](https://github.com/GetStream/stream-video-js/issues/679)) ([58c86bd](https://github.com/GetStream/stream-video-js/commit/58c86bd0354ebe444af361056dcc3fa82c4a926d))

### [0.0.21](https://github.com/GetStream/stream-video-js/compare/client0.0.20...client0.0.21) (2023-06-21)

### Documentation

- **react-sdk:** update audio rooms tutorial ([#659](https://github.com/GetStream/stream-video-js/issues/659)) ([11f2e80](https://github.com/GetStream/stream-video-js/commit/11f2e8090811fbd8478724b3d2c2c8af3b19a0c5))

### [0.0.20](https://github.com/GetStream/stream-video-js/compare/client0.0.19...client0.0.20) (2023-06-21)

### Bug Fixes

- proper media stream disposal for rn webrtc ([#682](https://github.com/GetStream/stream-video-js/issues/682)) ([8879bac](https://github.com/GetStream/stream-video-js/commit/8879bac82080232928b78316fdb452bbc3c79fbc))

### [0.0.19](https://github.com/GetStream/stream-video-js/compare/client0.0.18...client0.0.19) (2023-06-20)

### Bug Fixes

- Sentry import ([#677](https://github.com/GetStream/stream-video-js/issues/677)) ([0c52428](https://github.com/GetStream/stream-video-js/commit/0c52428053b4f025b51e6abea911e4bb89c6bd55))

### [0.0.18](https://github.com/GetStream/stream-video-js/compare/client0.0.17...client0.0.18) (2023-06-20)

### Features

- Custom logger example ([#669](https://github.com/GetStream/stream-video-js/issues/669)) ([208aed9](https://github.com/GetStream/stream-video-js/commit/208aed9f82dcbf5f9ffdf299c4672af855af344a))

### [0.0.17](https://github.com/GetStream/stream-video-js/compare/client0.0.16...client0.0.17) (2023-06-20)

### Features

- **react-native:** push notification for android ([#626](https://github.com/GetStream/stream-video-js/issues/626)) ([ec2e439](https://github.com/GetStream/stream-video-js/commit/ec2e4390cb724091352ba774c55ad2245ace2955))

### [0.0.16](https://github.com/GetStream/stream-video-js/compare/client0.0.15...client0.0.16) (2023-06-16)

### Documentation

- **react-sdk:** Runtime layout switching guide ([#642](https://github.com/GetStream/stream-video-js/issues/642)) ([1557168](https://github.com/GetStream/stream-video-js/commit/1557168da69660b71a0a420a94a0c354466681a7))

### [0.0.15](https://github.com/GetStream/stream-video-js/compare/client0.0.14...client0.0.15) (2023-06-16)

### Features

- Logging ([#654](https://github.com/GetStream/stream-video-js/issues/654)) ([30fc8f2](https://github.com/GetStream/stream-video-js/commit/30fc8f28e2f5829247256f24b040ea4a10336186))

### [0.0.14](https://github.com/GetStream/stream-video-js/compare/client0.0.13...client0.0.14) (2023-06-16)

### Bug Fixes

- **client:** do not allow to re-join left call ([#646](https://github.com/GetStream/stream-video-js/issues/646)) ([cbbbdfd](https://github.com/GetStream/stream-video-js/commit/cbbbdfd026c13673f98ccb50e8ee84140eec64b6))

### [0.0.13](https://github.com/GetStream/stream-video-js/compare/client0.0.12...client0.0.13) (2023-06-15)

### Bug Fixes

- do not send ring to backend if call was not created by the user ([#645](https://github.com/GetStream/stream-video-js/issues/645)) ([1fa8ffb](https://github.com/GetStream/stream-video-js/commit/1fa8ffbb7373e9eff497bfe1ce48a970aedc0d9d))

### [0.0.12](https://github.com/GetStream/stream-video-js/compare/client0.0.11...client0.0.12) (2023-06-13)

### Features

- Make it possible to provide user and token in StreamVideoClient… ([#631](https://github.com/GetStream/stream-video-js/issues/631)) ([93f9b03](https://github.com/GetStream/stream-video-js/commit/93f9b03313ac74179f1d93b513ea4de306312291))

### [0.0.11](https://github.com/GetStream/stream-video-js/compare/client0.0.10...client0.0.11) (2023-06-13)

### Features

- add audio room demo app ([#572](https://github.com/GetStream/stream-video-js/issues/572)) ([77f7b65](https://github.com/GetStream/stream-video-js/commit/77f7b6596047d59e10c8e58abad38c4f48cc162f))

### [0.0.10](https://github.com/GetStream/stream-video-js/compare/client0.0.9...client0.0.10) (2023-06-12)

### Features

- User connect and types ([#627](https://github.com/GetStream/stream-video-js/issues/627)) ([721ef61](https://github.com/GetStream/stream-video-js/commit/721ef611374540ef570a516009c78d58ce4f5360))

### [0.0.9](https://github.com/GetStream/stream-video-js/compare/client0.0.8...client0.0.9) (2023-06-12)

### Bug Fixes

- prevent misleading "stop publish" log messages upon call instantiation ([#629](https://github.com/GetStream/stream-video-js/issues/629)) ([af40939](https://github.com/GetStream/stream-video-js/commit/af4093966c408d37fbf59c4c8fafd22756aa8888))

### [0.0.8](https://github.com/GetStream/stream-video-js/compare/client0.0.7...client0.0.8) (2023-06-09)

### Features

- **react-native:** support reconnection flow ([#458](https://github.com/GetStream/stream-video-js/issues/458)) ([89f2dda](https://github.com/GetStream/stream-video-js/commit/89f2ddafd1397d91f8ddea5a3c69dd62ae027313))

### [0.0.7](https://github.com/GetStream/stream-video-js/compare/client0.0.6...client0.0.7) (2023-06-08)

### Features

- StreamCall signature, video client creation ([#596](https://github.com/GetStream/stream-video-js/issues/596)) ([5c3000c](https://github.com/GetStream/stream-video-js/commit/5c3000cc6fc3f8b7904609d7b11fa025b7458cad))

### [0.0.6](https://github.com/GetStream/stream-video-js/compare/client0.0.5...client0.0.6) (2023-06-07)

### Features

- Add token creation to client ([#607](https://github.com/GetStream/stream-video-js/issues/607)) ([5f95420](https://github.com/GetStream/stream-video-js/commit/5f9542029a64ddaf6ee7912ea7b364fc74c93bf0))

### [0.0.5](https://github.com/GetStream/stream-video-js/compare/client0.0.4...client0.0.5) (2023-06-06)

### Bug Fixes

- adjustments to the new egress response structure ([#595](https://github.com/GetStream/stream-video-js/issues/595)) ([3b3edea](https://github.com/GetStream/stream-video-js/commit/3b3edea7d032a50cb0757c6b46114e8009ae56fc))

### [0.0.4](https://github.com/GetStream/stream-video-js/compare/client0.0.3...client0.0.4) (2023-06-06)

### Bug Fixes

- use and save toggled dtx to sdp and remove empty lines when munging ([#597](https://github.com/GetStream/stream-video-js/issues/597)) ([3971276](https://github.com/GetStream/stream-video-js/commit/39712764ce7ac30557ef36ef7f736f2a0a5728b5))

### [0.0.3](https://github.com/GetStream/stream-video-js/compare/client0.0.2...client0.0.3) (2023-06-05)
