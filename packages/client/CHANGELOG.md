# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.36.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.35.1...@stream-io/video-client-1.36.0) (2025-10-30)

### Features

- Migrate logger to js-toolkit logger implementation ([#1959](https://github.com/GetStream/stream-video-js/issues/1959)) ([5a424f7](https://github.com/GetStream/stream-video-js/commit/5a424f72cec2a8cbc0bfa23147d9988ab9bfbdc1))

## [1.35.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.35.0...@stream-io/video-client-1.35.1) (2025-10-27)

- **deps-dev:** bump happy-dom from 20.0.0 to 20.0.2 ([#1970](https://github.com/GetStream/stream-video-js/issues/1970)) ([702f409](https://github.com/GetStream/stream-video-js/commit/702f409b2e5529e7b8f1cfc757e2e776c75deacf)), closes [#1934](https://github.com/GetStream/stream-video-js/issues/1934) [#1932](https://github.com/GetStream/stream-video-js/issues/1932) [#0](https://github.com/GetStream/stream-video-js/issues/0) [#1934](https://github.com/GetStream/stream-video-js/issues/1934) [#0](https://github.com/GetStream/stream-video-js/issues/0) [#1932](https://github.com/GetStream/stream-video-js/issues/1932)

## [1.35.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.34.1...@stream-io/video-client-1.35.0) (2025-10-24)

### Features

- Participant Stats ([#1922](https://github.com/GetStream/stream-video-js/issues/1922)) ([b96de03](https://github.com/GetStream/stream-video-js/commit/b96de03a2b96db2288a6d2d52a25d3deea9148d8))

## [1.34.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.34.0...@stream-io/video-client-1.34.1) (2025-10-17)

### Bug Fixes

- camera toggle along with flip ([#1961](https://github.com/GetStream/stream-video-js/issues/1961)) ([2703121](https://github.com/GetStream/stream-video-js/commit/2703121d27aee7a54bdc07b99a30feea9a4e4512))

## [1.34.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.33.1...@stream-io/video-client-1.34.0) (2025-10-14)

- use fromPartial instead of suppressing ts-errors ([#1949](https://github.com/GetStream/stream-video-js/issues/1949)) ([95e5654](https://github.com/GetStream/stream-video-js/commit/95e5654e2bac5dc7c5126079795fca9951652290))

### Features

- **deps:** React 19.1, React Native 0.81, NextJS 15.5, Expo 54 ([#1940](https://github.com/GetStream/stream-video-js/issues/1940)) ([30f8ce2](https://github.com/GetStream/stream-video-js/commit/30f8ce2b335189e1f77160236839bc6c6a02f634))
- move audio route manager inside SDK ([#1840](https://github.com/GetStream/stream-video-js/issues/1840)) ([847dd30](https://github.com/GetStream/stream-video-js/commit/847dd30d6240a0780fe3d58d681554bc392f6f51)), closes [#1829](https://github.com/GetStream/stream-video-js/issues/1829)

### Bug Fixes

- flush rtc stats when reconnecting ([#1946](https://github.com/GetStream/stream-video-js/issues/1946)) ([fb1f6fc](https://github.com/GetStream/stream-video-js/commit/fb1f6fcb2837154a4fe746a6efe4f9a4830bca20))

## [1.33.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.33.0...@stream-io/video-client-1.33.1) (2025-10-02)

### Bug Fixes

- ensure ingress participants are prioritized ([#1943](https://github.com/GetStream/stream-video-js/issues/1943)) ([a51a119](https://github.com/GetStream/stream-video-js/commit/a51a119cfb9f13736395b4afb3d3947ef994a6d9))

## [1.33.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.32.0...@stream-io/video-client-1.33.0) (2025-09-30)

### Features

- Audio profiles and Hi-Fi stereo audio ([#1887](https://github.com/GetStream/stream-video-js/issues/1887)) ([3b60c89](https://github.com/GetStream/stream-video-js/commit/3b60c89b8c0dbc40544fe13be79c10e93bbddd3d))

### Bug Fixes

- **client:** server side pinning ([#1936](https://github.com/GetStream/stream-video-js/issues/1936)) ([cd33b9e](https://github.com/GetStream/stream-video-js/commit/cd33b9e4417e8fdc452b6d4a192e10183ddfa31b))

## [1.32.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.31.0...@stream-io/video-client-1.32.0) (2025-09-29)

### Features

- **react-native:** reject call when busy ([#1856](https://github.com/GetStream/stream-video-js/issues/1856)) ([b60bc7c](https://github.com/GetStream/stream-video-js/commit/b60bc7cd2dc2e09d52496d7b5cb593cac4b89485))

### Bug Fixes

- restore calling state after unrecoverable join fail ([#1935](https://github.com/GetStream/stream-video-js/issues/1935)) ([8ab0168](https://github.com/GetStream/stream-video-js/commit/8ab01680d01cc47f9cf48078634358507f0c109d))
- send unifiedSessionId in the initial join request ([#1934](https://github.com/GetStream/stream-video-js/issues/1934)) ([e6a533d](https://github.com/GetStream/stream-video-js/commit/e6a533d7e926086ac5930ebfb4648dade449d15a))

## [1.31.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.30.1...@stream-io/video-client-1.31.0) (2025-09-17)

### Features

- introduce @stream-io/worker-timers ([94c962b](https://github.com/GetStream/stream-video-js/commit/94c962b2c5f731c152771b7803a59664fa925477))

### Bug Fixes

- **video-filters:** prevent background tab throttling ([#1920](https://github.com/GetStream/stream-video-js/issues/1920)) ([f93d5cc](https://github.com/GetStream/stream-video-js/commit/f93d5cc5785957c7f181fcaf689ec366df9e646b))

## [1.30.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.30.0...@stream-io/video-client-1.30.1) (2025-09-16)

### Bug Fixes

- don't apply default camera state if video is off ([#1917](https://github.com/GetStream/stream-video-js/issues/1917)) ([9cf1d75](https://github.com/GetStream/stream-video-js/commit/9cf1d752d824a0527fbb187df21d8a020590d4bb))
- **rn:** set direction state for flip after constraints are applied ([1f03c59](https://github.com/GetStream/stream-video-js/commit/1f03c59b9b3fecc0ff1f7cb6b0eccb083b4a3475))

## [1.30.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.29.0...@stream-io/video-client-1.30.0) (2025-09-11)

- Skip tests for StreamVideoClient coordinator API ([aabe1d0](https://github.com/GetStream/stream-video-js/commit/aabe1d0ad3e3a95698b422991729e46289ab0277))

### Features

- Participant Source ([#1896](https://github.com/GetStream/stream-video-js/issues/1896)) ([b1cf710](https://github.com/GetStream/stream-video-js/commit/b1cf710ac3bfda573c0379dac1e6a107d2dbabf6))

## [1.29.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.28.1...@stream-io/video-client-1.29.0) (2025-09-09)

### Features

- opt-out from optimistic updates ([#1904](https://github.com/GetStream/stream-video-js/issues/1904)) ([45dba34](https://github.com/GetStream/stream-video-js/commit/45dba34d38dc64f456e37b593e38e420426529f5))

### Bug Fixes

- capabilities and call grants ([#1899](https://github.com/GetStream/stream-video-js/issues/1899)) ([5725dfa](https://github.com/GetStream/stream-video-js/commit/5725dfa29b1e5fdb6fe4e26825ce7b268664d2fa))
- graceful Axios request config overrides ([#1913](https://github.com/GetStream/stream-video-js/issues/1913)) ([a124099](https://github.com/GetStream/stream-video-js/commit/a124099f984a592750d66ac440ef6c27ae7a02d9))

## [1.28.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.28.0...@stream-io/video-client-1.28.1) (2025-08-22)

### Bug Fixes

- handle pre ended calls on ringing push arrival ([#1897](https://github.com/GetStream/stream-video-js/issues/1897)) ([935e375](https://github.com/GetStream/stream-video-js/commit/935e3756035639c651b3ac4469321a64b8576a0e))

## [1.28.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.27.5...@stream-io/video-client-1.28.0) (2025-08-21)

### Features

- Kick user from a call ([#1894](https://github.com/GetStream/stream-video-js/issues/1894)) ([32e2afc](https://github.com/GetStream/stream-video-js/commit/32e2afca0ea59e3f57e1ff9d05828c1e07fbff78))

## [1.27.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.27.4...@stream-io/video-client-1.27.5) (2025-08-15)

### Bug Fixes

- synchronize ring events ([#1888](https://github.com/GetStream/stream-video-js/issues/1888)) ([0951e6d](https://github.com/GetStream/stream-video-js/commit/0951e6d4c825806937d6bdc548df9f186c531466))

## [1.27.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.27.3...@stream-io/video-client-1.27.4) (2025-08-13)

### Bug Fixes

- expose isSupportedBrowser() utility ([#1859](https://github.com/GetStream/stream-video-js/issues/1859)) ([f51a434](https://github.com/GetStream/stream-video-js/commit/f51a4341f57407210ab2e9ba57f41818ddbd7ed9))

## [1.27.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.27.2...@stream-io/video-client-1.27.3) (2025-08-07)

### Bug Fixes

- extended telemetry data for the signal websocket ([#1881](https://github.com/GetStream/stream-video-js/issues/1881)) ([984703d](https://github.com/GetStream/stream-video-js/commit/984703dabb8c6189eaf4d6925421568f6d0fd7fc))

## [1.27.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.27.1...@stream-io/video-client-1.27.2) (2025-08-05)

### Bug Fixes

- improved logging and tracing ([#1874](https://github.com/GetStream/stream-video-js/issues/1874)) ([e450ce2](https://github.com/GetStream/stream-video-js/commit/e450ce2a294d6f80480fcc709591c13d9ede79e4))

## [1.27.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.27.0...@stream-io/video-client-1.27.1) (2025-07-25)

### Bug Fixes

- improved audio and video filter tracing ([#1862](https://github.com/GetStream/stream-video-js/issues/1862)) ([701ea4b](https://github.com/GetStream/stream-video-js/commit/701ea4b3266f68072c1325b70221fdefd77137ec))
- synchronize updateMuteState; use correct fallback dimensions ([#1867](https://github.com/GetStream/stream-video-js/issues/1867)) ([154cdda](https://github.com/GetStream/stream-video-js/commit/154cddaa4462ee03af5fdf4929ad9f4e3d4b5070))
- trace available devices and thermal state changes ([#1866](https://github.com/GetStream/stream-video-js/issues/1866)) ([d8312b5](https://github.com/GetStream/stream-video-js/commit/d8312b5c109b14baa28ee764202d387499d0fd52))

## [1.27.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.26.1...@stream-io/video-client-1.27.0) (2025-07-18)

### Features

- Inbound Video Pause ([#1841](https://github.com/GetStream/stream-video-js/issues/1841)) ([5c7eb3a](https://github.com/GetStream/stream-video-js/commit/5c7eb3ac8b0fcfd663226d537279c8a941dedc21))

### Bug Fixes

- more graceful handling of SFU join failures ([#1853](https://github.com/GetStream/stream-video-js/issues/1853)) ([f38a4b5](https://github.com/GetStream/stream-video-js/commit/f38a4b5eef62210b08424640040a88065b680707))

## [1.26.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.26.0...@stream-io/video-client-1.26.1) (2025-07-17)

### Bug Fixes

- force `play-and-record` audioSession on Safari ([#1855](https://github.com/GetStream/stream-video-js/issues/1855)) ([a3552a3](https://github.com/GetStream/stream-video-js/commit/a3552a3be606ac99120b6c4ce6187eaa920a02ef))

## [1.26.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.25.5...@stream-io/video-client-1.26.0) (2025-07-11)

### Features

- **react-native:** speech detection ([#1850](https://github.com/GetStream/stream-video-js/issues/1850)) ([3f53e95](https://github.com/GetStream/stream-video-js/commit/3f53e95fdf0e739c809648211c52542d86df183f))

## [1.25.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.25.4...@stream-io/video-client-1.25.5) (2025-07-08)

### Bug Fixes

- relax SFU leaveAndClose constraints ([#1848](https://github.com/GetStream/stream-video-js/issues/1848)) ([dbf8bb0](https://github.com/GetStream/stream-video-js/commit/dbf8bb0c6f9f5358f21db3e78bd40ce01ad9bf6d)), closes [#1846](https://github.com/GetStream/stream-video-js/issues/1846)

## [1.25.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.25.3...@stream-io/video-client-1.25.4) (2025-07-07)

### Bug Fixes

- sync call state after a failed reconnect ([#1846](https://github.com/GetStream/stream-video-js/issues/1846)) ([905e5c2](https://github.com/GetStream/stream-video-js/commit/905e5c2011d3267e83b3f2a861a4175de4111cfa))

## [1.25.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.25.2...@stream-io/video-client-1.25.3) (2025-07-03)

- bump the default test timeout ([bea27db](https://github.com/GetStream/stream-video-js/commit/bea27db1922a6f2a0899375d1a4cade1eb1291b5))
- increase axios timeout ([d9cc4ac](https://github.com/GetStream/stream-video-js/commit/d9cc4ac69f58d12d97af0c714df564349c17c9b5))

## [1.25.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.25.1...@stream-io/video-client-1.25.2) (2025-07-02)

### Bug Fixes

- resolve `default` device id into real id ([#1839](https://github.com/GetStream/stream-video-js/issues/1839)) ([1a1037f](https://github.com/GetStream/stream-video-js/commit/1a1037f21ef2926c7da78b6461499f37742935e9))

## [1.25.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.25.0...@stream-io/video-client-1.25.1) (2025-06-30)

### Bug Fixes

- correctly setup and dispose device managers ([#1836](https://github.com/GetStream/stream-video-js/issues/1836)) ([92fbe6c](https://github.com/GetStream/stream-video-js/commit/92fbe6c1da3bf06847244f430652bdc9433533bf))

## [1.25.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.24.0...@stream-io/video-client-1.25.0) (2025-06-20)

- upgrade stream deps and improve API error code logging ([#1827](https://github.com/GetStream/stream-video-js/issues/1827)) ([8c30fef](https://github.com/GetStream/stream-video-js/commit/8c30fef80d78055f5adeae02f7347c1c3fe49b72)), closes [#1826](https://github.com/GetStream/stream-video-js/issues/1826)

### Features

- stereo support ([#1833](https://github.com/GetStream/stream-video-js/issues/1833)) ([389b2f2](https://github.com/GetStream/stream-video-js/commit/389b2f2f0d7e4098b916a18b7c079d7029e35949))
- Support for Screen Share content hinting ([#1834](https://github.com/GetStream/stream-video-js/issues/1834)) ([a09ff78](https://github.com/GetStream/stream-video-js/commit/a09ff78e8c5a78ea435bec17dfd5b2b63ef5c78d))

### Bug Fixes

- multiple FAST reconnect attempts and improved ICE restarts ([#1811](https://github.com/GetStream/stream-video-js/issues/1811)) ([f64c922](https://github.com/GetStream/stream-video-js/commit/f64c92292dcc6d216acb130ad51347449968f420))
- ringing call fixes and support for pronto ([#1823](https://github.com/GetStream/stream-video-js/issues/1823)) ([c0414f8](https://github.com/GetStream/stream-video-js/commit/c0414f88ec7dd42ad35991565f9d337ea7e0fc6d))

## [1.24.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.23.5...@stream-io/video-client-1.24.0) (2025-06-12)

### Features

- moderation support ([#1822](https://github.com/GetStream/stream-video-js/issues/1822)) ([3948fae](https://github.com/GetStream/stream-video-js/commit/3948faeb2fa7ace8dd9c1df990f6e41e73fc0a26))

### Bug Fixes

- configurable call stats reporting interval ([#1824](https://github.com/GetStream/stream-video-js/issues/1824)) ([74f72c0](https://github.com/GetStream/stream-video-js/commit/74f72c024d0cb34ae3e0fee4bd8f061fb51e4479))
- don't compute call stats report if no one subscribed to it ([#1825](https://github.com/GetStream/stream-video-js/issues/1825)) ([fb6a8c9](https://github.com/GetStream/stream-video-js/commit/fb6a8c9e19c80be313d73fadb68810e7f7c1f071))

## [1.23.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.23.4...@stream-io/video-client-1.23.5) (2025-06-04)

### Bug Fixes

- **react-native:** skip browser permission for react native ([#1818](https://github.com/GetStream/stream-video-js/issues/1818)) ([b18f418](https://github.com/GetStream/stream-video-js/commit/b18f418698e12b9804efb43e712ba813b0dbb056))

## [1.23.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.23.3...@stream-io/video-client-1.23.4) (2025-06-03)

### Bug Fixes

- attach original token provider error as cause to loadToken rejection ([#1812](https://github.com/GetStream/stream-video-js/issues/1812)) ([15f817c](https://github.com/GetStream/stream-video-js/commit/15f817c2548a8edba8ca1004e133277d67cbeb4f))
- improved video quality on low capture resolution ([#1814](https://github.com/GetStream/stream-video-js/issues/1814)) ([ebcfdf7](https://github.com/GetStream/stream-video-js/commit/ebcfdf7f7e8146fcaf18a8bee81086f5a23f5df3))

## [1.23.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.23.2...@stream-io/video-client-1.23.3) (2025-06-02)

- remove TODO ([9cfea4b](https://github.com/GetStream/stream-video-js/commit/9cfea4b54284cdd680a6d666436dedc5fd8956c3))

### Bug Fixes

- inconsistent device state if applySettingsToStream fails ([#1808](https://github.com/GetStream/stream-video-js/issues/1808)) ([73d66c2](https://github.com/GetStream/stream-video-js/commit/73d66c2eaa7eca52b9d41b39f8f9fd0a0ce240ef))
- test ([e0b93aa](https://github.com/GetStream/stream-video-js/commit/e0b93aaa13f22f0db30b61e6230aff40ba8fd92a))
- use AudioContext for Safari ([#1810](https://github.com/GetStream/stream-video-js/issues/1810)) ([63542f4](https://github.com/GetStream/stream-video-js/commit/63542f419efa475c7acf50f053621ace74a1eff4))

## [1.23.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.23.1...@stream-io/video-client-1.23.2) (2025-05-22)

### Bug Fixes

- rpc error tracing ([#1801](https://github.com/GetStream/stream-video-js/issues/1801)) ([a9e86d5](https://github.com/GetStream/stream-video-js/commit/a9e86d5e51e72b15d044e012f5fcc5a44907c325))

## [1.23.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.23.0...@stream-io/video-client-1.23.1) (2025-05-21)

### Bug Fixes

- restore echoCancellation settings ([#1799](https://github.com/GetStream/stream-video-js/issues/1799)) ([e839036](https://github.com/GetStream/stream-video-js/commit/e839036f279ee9b27ce3d62d4f07e3517c3e5fef)), closes [#1794](https://github.com/GetStream/stream-video-js/issues/1794)

## [1.23.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.22.2...@stream-io/video-client-1.23.0) (2025-05-20)

### Features

- **react-native:** Noise Cancellation ([#1793](https://github.com/GetStream/stream-video-js/issues/1793)) ([d7843e1](https://github.com/GetStream/stream-video-js/commit/d7843e1a23e6f6a35d1c159438d09bdfd17450a5))
- **web:** improved noise cancellation ([#1794](https://github.com/GetStream/stream-video-js/issues/1794)) ([d59f19b](https://github.com/GetStream/stream-video-js/commit/d59f19b1ba1ff83fe5f024d783b868f4e98d3380))

### Bug Fixes

- do not mutate filters array during pipeline setup ([#1798](https://github.com/GetStream/stream-video-js/issues/1798)) ([e9832e5](https://github.com/GetStream/stream-video-js/commit/e9832e5ef41b3f6cddfe2d0cb2cf840e9b28bb86))

## [1.22.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.22.1...@stream-io/video-client-1.22.2) (2025-05-15)

- adjust ErrorFromResponse class ([#1791](https://github.com/GetStream/stream-video-js/issues/1791)) ([c0abcba](https://github.com/GetStream/stream-video-js/commit/c0abcbacfddeb87d8378c4418f80e6770981cdc8)), closes [GetStream/chat#1540](https://github.com/GetStream/chat/issues/1540)

### Bug Fixes

- enable chore releases ([#1792](https://github.com/GetStream/stream-video-js/issues/1792)) ([6046654](https://github.com/GetStream/stream-video-js/commit/6046654fe19505a1c115a4fb838759d010540614))

## [1.22.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.22.0...@stream-io/video-client-1.22.1) (2025-05-14)

### Bug Fixes

- fixes an edge case where tracks weren't restored after a reconnect ([#1789](https://github.com/GetStream/stream-video-js/issues/1789)) ([d825e8e](https://github.com/GetStream/stream-video-js/commit/d825e8e39ac8cbd072ec9d5124e1ea0226216e08))

## [1.22.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.21.0...@stream-io/video-client-1.22.0) (2025-05-08)

### Features

- Expo 53 Swift Config Plugin and React Native 0.79 compatibility ([#1714](https://github.com/GetStream/stream-video-js/issues/1714)) ([380331e](https://github.com/GetStream/stream-video-js/commit/380331e11fd6182c3111413aa25689a669dd3c9c))

### Bug Fixes

- graceful handling of LIVE_ENDED CallEnded reason ([#1783](https://github.com/GetStream/stream-video-js/issues/1783)) ([ff54390](https://github.com/GetStream/stream-video-js/commit/ff54390099e10c550b8bbac42658080a65007a30))
- isolate mediaDevices traces ([#1779](https://github.com/GetStream/stream-video-js/issues/1779)) ([d8623f0](https://github.com/GetStream/stream-video-js/commit/d8623f0b06a6229bff96ea01dd1f2b851b7d3558)), closes [#1765](https://github.com/GetStream/stream-video-js/issues/1765)
- make camera.flip() work more reliably with older devices ([#1781](https://github.com/GetStream/stream-video-js/issues/1781)) ([9dfbc55](https://github.com/GetStream/stream-video-js/commit/9dfbc556155c1ae9b528b50b140313c4decb024f)), closes [#1679](https://github.com/GetStream/stream-video-js/issues/1679)
- use scoped locking for PeerConnection events ([#1785](https://github.com/GetStream/stream-video-js/issues/1785)) ([b0f93e8](https://github.com/GetStream/stream-video-js/commit/b0f93e83e70520b527efd94e9192ac7dca031864))

## [1.21.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.20.2...@stream-io/video-client-1.21.0) (2025-05-02)

### Features

- encode and decode PerformanceStats tracing ([#1765](https://github.com/GetStream/stream-video-js/issues/1765)) ([138ea84](https://github.com/GetStream/stream-video-js/commit/138ea84fee834da03cf3c8042fbb2f071526f135))

## [1.20.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.20.1...@stream-io/video-client-1.20.2) (2025-05-01)

### Bug Fixes

- add options for 4K RTMP and Recording ([#1775](https://github.com/GetStream/stream-video-js/issues/1775)) ([c09213d](https://github.com/GetStream/stream-video-js/commit/c09213df5fc8a46f5a8c5c1ef18f07fd05e1d547))
- use timeout reason when auto-dropping calls (instead of decline) ([#1776](https://github.com/GetStream/stream-video-js/issues/1776)) ([a043148](https://github.com/GetStream/stream-video-js/commit/a04314814e728c3d05d53c8940e9c223fec18fcc))

## [1.20.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.20.0...@stream-io/video-client-1.20.1) (2025-04-29)

### Bug Fixes

- dispose media stream if it cannot be published ([#1771](https://github.com/GetStream/stream-video-js/issues/1771)) ([83fbfd7](https://github.com/GetStream/stream-video-js/commit/83fbfd7bb77bd9a06d6955e6b48bb8238e573f57))
- use more granular permission state for stats reporter ([#1774](https://github.com/GetStream/stream-video-js/issues/1774)) ([55afdfc](https://github.com/GetStream/stream-video-js/commit/55afdfcdac55fad25ba32978caf55a2f25f7580b))

## [1.20.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.19.3...@stream-io/video-client-1.20.0) (2025-04-24)

- bump test timeout ([7d922ed](https://github.com/GetStream/stream-video-js/commit/7d922ed34c46851a257fb36ee644f1ff5e4cb917))

### Features

- add getCallReport method ([#1767](https://github.com/GetStream/stream-video-js/issues/1767)) ([12e064f](https://github.com/GetStream/stream-video-js/commit/12e064f34a08731ded289651125bbe20e2bbf4f4))

## [1.19.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.19.2...@stream-io/video-client-1.19.3) (2025-04-15)

### Bug Fixes

- fast reconnect shouldn't be followed up with full rejoining on network switch ([#1760](https://github.com/GetStream/stream-video-js/issues/1760)) ([71363bd](https://github.com/GetStream/stream-video-js/commit/71363bdf0fb6cd6273ff6c2a0faf9ea1eb53f121))
- watched calls should auto-subscribe for state updates ([#1762](https://github.com/GetStream/stream-video-js/issues/1762)) ([abcb45b](https://github.com/GetStream/stream-video-js/commit/abcb45b7fed4ca10e4ac6ea8ee18630ca5a9cb46)), closes [#1433](https://github.com/GetStream/stream-video-js/issues/1433)

## [1.19.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.19.1...@stream-io/video-client-1.19.2) (2025-04-11)

### Bug Fixes

- enhance tracing data ([#1758](https://github.com/GetStream/stream-video-js/issues/1758)) ([a6f2e3a](https://github.com/GetStream/stream-video-js/commit/a6f2e3a5256519e4884ec07e2dd2d4417f2482fe))

## [1.19.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.19.0...@stream-io/video-client-1.19.1) (2025-04-09)

### Bug Fixes

- add an opt-out for persisted device preferences ([#1753](https://github.com/GetStream/stream-video-js/issues/1753)) ([4d55c3e](https://github.com/GetStream/stream-video-js/commit/4d55c3ee982bcb72beec347489e7c945bb2c63e3))

## [1.19.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.9...@stream-io/video-client-1.19.0) (2025-04-04)

### Features

- collect more granular RTC stats and RPC tracing ([#1735](https://github.com/GetStream/stream-video-js/issues/1735)) ([e356d6b](https://github.com/GetStream/stream-video-js/commit/e356d6b9fe361c186a5b92de55fabf0598ea4885))

## [1.18.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.8...@stream-io/video-client-1.18.9) (2025-04-02)

### Bug Fixes

- pick correct device for speaking while muted detection ([#1744](https://github.com/GetStream/stream-video-js/issues/1744)) ([33044f5](https://github.com/GetStream/stream-video-js/commit/33044f56ec7debba2e14d5a87dde9eaa87a02089)), closes [#1538](https://github.com/GetStream/stream-video-js/issues/1538)
- reset the call state value when "live" ends ([#1740](https://github.com/GetStream/stream-video-js/issues/1740)) ([2123a10](https://github.com/GetStream/stream-video-js/commit/2123a104bb790a7384506fd475b779c02b116edd))

## [1.18.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.7...@stream-io/video-client-1.18.8) (2025-04-01)

- dependency upgrades and cleanup ([#1727](https://github.com/GetStream/stream-video-js/issues/1727)) ([c3b0ede](https://github.com/GetStream/stream-video-js/commit/c3b0ede3ce444c28c51457155e8ccff584c2c1e5))

### Bug Fixes

- implement retry logic for call joining process ([#1738](https://github.com/GetStream/stream-video-js/issues/1738)) ([71599c3](https://github.com/GetStream/stream-video-js/commit/71599c3ddda51a247d7933cd6b12ca8fd03d7033))

## [1.18.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.6...@stream-io/video-client-1.18.7) (2025-03-20)

### Bug Fixes

- rename `toJSON` to `asJSON` ([#1729](https://github.com/GetStream/stream-video-js/issues/1729)) ([0d7d074](https://github.com/GetStream/stream-video-js/commit/0d7d074dac1032690b5f4af4d6ba5fcdd56dfaa2))
- update call reject reasons ([#1730](https://github.com/GetStream/stream-video-js/issues/1730)) ([100ed6b](https://github.com/GetStream/stream-video-js/commit/100ed6b9323b66e86123917abf4fc2973a677fca))

## [1.18.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.5...@stream-io/video-client-1.18.6) (2025-03-13)

### Bug Fixes

- ensure negotiation runs sequentially ([#1722](https://github.com/GetStream/stream-video-js/issues/1722)) ([7e166aa](https://github.com/GetStream/stream-video-js/commit/7e166aaf606c3f751068cf60bd554e6374f701d7))

## [1.18.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.4...@stream-io/video-client-1.18.5) (2025-03-12)

- Upgrade to Next 15.2 ([#1717](https://github.com/GetStream/stream-video-js/issues/1717)) ([9b1aec3](https://github.com/GetStream/stream-video-js/commit/9b1aec3447dee611c0d900db44add6b6c89e2b8d))

### Bug Fixes

- add pending browser permission state ([#1718](https://github.com/GetStream/stream-video-js/issues/1718)) ([7f24be6](https://github.com/GetStream/stream-video-js/commit/7f24be63d33105d0688be7b5b625bc9b6aa0d3a9))

## [1.18.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.3...@stream-io/video-client-1.18.4) (2025-03-10)

### Bug Fixes

- retryable client.connectUser() ([#1710](https://github.com/GetStream/stream-video-js/issues/1710)) ([10b6860](https://github.com/GetStream/stream-video-js/commit/10b6860e1d65c38d8eb0ba7d7ea18f0ca30f5abc))

## [1.18.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.2...@stream-io/video-client-1.18.3) (2025-03-05)

### Bug Fixes

- revert the release of cloned track on publisher dispose ([556fb61](https://github.com/GetStream/stream-video-js/commit/556fb610ae1c9a1965f38fc07e995683b5052544))

## [1.18.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.1...@stream-io/video-client-1.18.2) (2025-03-04)

### Bug Fixes

- do not accept again on reconnections ([#1705](https://github.com/GetStream/stream-video-js/issues/1705)) ([bedd2d8](https://github.com/GetStream/stream-video-js/commit/bedd2d8aafd7ff8260f63b500e25807518ccd365))
- do not stop original track in RN ([#1708](https://github.com/GetStream/stream-video-js/issues/1708)) ([ab0ada2](https://github.com/GetStream/stream-video-js/commit/ab0ada283c753d4cdfd59b6eaf75af26cf54fd7e))
- prevent extra unnecessary reconnect after offline to online ([#1706](https://github.com/GetStream/stream-video-js/issues/1706)) ([bc3920a](https://github.com/GetStream/stream-video-js/commit/bc3920a81f398fd9e166ee4517b32d58f50d56fe))

## [1.18.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.18.0...@stream-io/video-client-1.18.1) (2025-02-28)

### Bug Fixes

- prevent reconnecting state when offline ([#1703](https://github.com/GetStream/stream-video-js/issues/1703)) ([aeac90d](https://github.com/GetStream/stream-video-js/commit/aeac90d8b7b14820e3e0e30282e51fc7824f8bf8))

## [1.18.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.17.1...@stream-io/video-client-1.18.0) (2025-02-26)

### Features

- align SDK version reporting, use higher-entropy user agent data for stats ([#1696](https://github.com/GetStream/stream-video-js/issues/1696)) ([e02e8d9](https://github.com/GetStream/stream-video-js/commit/e02e8d9b3843086a3fa859a8bd31ba65ace5a7fd))

### Bug Fixes

- don't implicitly mark calls as `ringing` ([#1697](https://github.com/GetStream/stream-video-js/issues/1697)) ([3429a7b](https://github.com/GetStream/stream-video-js/commit/3429a7ba52e13a43b96d2c3c28f270da111f84b2)), closes [/github.com/GetStream/stream-video-js/issues/1561#issuecomment-2662584543](https://github.com/GetStream//github.com/GetStream/stream-video-js/issues/1561/issues/issuecomment-2662584543)
- use axios version that doesnt import node specific module ([#1699](https://github.com/GetStream/stream-video-js/issues/1699)) ([414e01b](https://github.com/GetStream/stream-video-js/commit/414e01b9c7e4c4862b429e48c506673bcc228fa4))

## [1.17.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.17.0...@stream-io/video-client-1.17.1) (2025-02-19)

### Bug Fixes

- do not reconnect when device is offline ([#1688](https://github.com/GetStream/stream-video-js/issues/1688)) ([c6b6f58](https://github.com/GetStream/stream-video-js/commit/c6b6f58310a3365eb6f40d76a15c26791f413241))

## [1.17.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.16.7...@stream-io/video-client-1.17.0) (2025-02-17)

### Features

- support static token and token provider at the same time ([#1685](https://github.com/GetStream/stream-video-js/issues/1685)) ([4365a3d](https://github.com/GetStream/stream-video-js/commit/4365a3dd0a14c98041982bde8be21258b8cfd571))

## [1.16.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.16.6...@stream-io/video-client-1.16.7) (2025-02-12)

### Bug Fixes

- relax device constraints on NotFoundError DOMException ([#1680](https://github.com/GetStream/stream-video-js/issues/1680)) ([c682908](https://github.com/GetStream/stream-video-js/commit/c682908408395f6863fd1549958cf4203bcc7f32))

## [1.16.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.16.5...@stream-io/video-client-1.16.6) (2025-02-11)

### Bug Fixes

- prefer the async apply constraints for flip ([#1679](https://github.com/GetStream/stream-video-js/issues/1679)) ([8c246cc](https://github.com/GetStream/stream-video-js/commit/8c246cc4e9f1ac766366cf24b82dd99aa868017d))

## [1.16.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.16.4...@stream-io/video-client-1.16.5) (2025-02-10)

### Bug Fixes

- ensure all tracks are stopped when disposing a Publisher ([#1677](https://github.com/GetStream/stream-video-js/issues/1677)) ([172d345](https://github.com/GetStream/stream-video-js/commit/172d345ceada2bf82df1aec604a2325947896c5c)), closes [#1676](https://github.com/GetStream/stream-video-js/issues/1676)

## [1.16.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.16.3...@stream-io/video-client-1.16.4) (2025-02-07)

### Bug Fixes

- ensure tracks are stopped when disposing a Publisher ([#1676](https://github.com/GetStream/stream-video-js/issues/1676)) ([948f672](https://github.com/GetStream/stream-video-js/commit/948f672243e1f2a0e9499184ee31db4bc88f9952))

## [1.16.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.16.2...@stream-io/video-client-1.16.3) (2025-02-06)

### Bug Fixes

- relaxed validation for submitting feedback ([#1673](https://github.com/GetStream/stream-video-js/issues/1673)) ([98685b9](https://github.com/GetStream/stream-video-js/commit/98685b9fcf3c3b0309a7072d51cde4657e028528))

## [1.16.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.16.1...@stream-io/video-client-1.16.2) (2025-02-05)

### Bug Fixes

- race condition with unrecoverable error handling ([#1672](https://github.com/GetStream/stream-video-js/issues/1672)) ([be8095c](https://github.com/GetStream/stream-video-js/commit/be8095ce946cf98a0dfc1f3ea3391376cc7d2896)), closes [#1649](https://github.com/GetStream/stream-video-js/issues/1649) [#1618](https://github.com/GetStream/stream-video-js/issues/1618)

## [1.16.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.16.0...@stream-io/video-client-1.16.1) (2025-02-05)

- add trace log for call unregister ([e20d9dc](https://github.com/GetStream/stream-video-js/commit/e20d9dc28b35c5dd0c921ccc3e18923a344ae5ab))

### Bug Fixes

- do not mute track on camera flip ([#1671](https://github.com/GetStream/stream-video-js/issues/1671)) ([963eb4d](https://github.com/GetStream/stream-video-js/commit/963eb4d4e5d6b96afb61b4da23a05ad92bcb3973))

## [1.16.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.15.7...@stream-io/video-client-1.16.0) (2025-01-31)

### Features

- OpenAPI upgrades and HLS status reporting ([#1668](https://github.com/GetStream/stream-video-js/issues/1668)) ([2f377b8](https://github.com/GetStream/stream-video-js/commit/2f377b8772f7b9fc8fcb8b8e9b3eecb1920bc7d0))

## [1.15.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.15.6...@stream-io/video-client-1.15.7) (2025-01-29)

### Bug Fixes

- speech detection and align mic disable with web ([#1658](https://github.com/GetStream/stream-video-js/issues/1658)) ([fd908fb](https://github.com/GetStream/stream-video-js/commit/fd908fb2b70e6bade595f44107ca2f85aa4d5631))

## [1.15.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.15.5...@stream-io/video-client-1.15.6) (2025-01-29)

### Bug Fixes

- ensures that maxBitrate is an integer ([#1657](https://github.com/GetStream/stream-video-js/issues/1657)) ([69eee96](https://github.com/GetStream/stream-video-js/commit/69eee969ac4d52e3410d8e5e12e012b02a5eb1b7)), closes [#1527](https://github.com/GetStream/stream-video-js/issues/1527)

## [1.15.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.15.4...@stream-io/video-client-1.15.5) (2025-01-24)

### Bug Fixes

- remove the participants from state when leaving call ([003ac26](https://github.com/GetStream/stream-video-js/commit/003ac26eff3c14779d5f25e6e64973c88a5b811d))

## [1.15.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.15.3...@stream-io/video-client-1.15.4) (2025-01-23)

### Bug Fixes

- leave ringing call if accepted or rejected elsewhere ([#1654](https://github.com/GetStream/stream-video-js/issues/1654)) ([9f25adf](https://github.com/GetStream/stream-video-js/commit/9f25adf8796db369f7e3e236e6a178f525ae8f55))

## [1.15.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.15.2...@stream-io/video-client-1.15.3) (2025-01-21)

### Bug Fixes

- restore calling state if SFU connection fails during join ([#1652](https://github.com/GetStream/stream-video-js/issues/1652)) ([ff7f221](https://github.com/GetStream/stream-video-js/commit/ff7f221ad285ca1994fc3a780aa8183df2de3e99))

## [1.15.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.15.1...@stream-io/video-client-1.15.2) (2025-01-20)

### Bug Fixes

- improved error handling when connecting to an SFU ([#1648](https://github.com/GetStream/stream-video-js/issues/1648)) ([27332b4](https://github.com/GetStream/stream-video-js/commit/27332b484094e26a123a1dfe8bb614c35ce1022a))

## [1.15.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.15.0...@stream-io/video-client-1.15.1) (2025-01-16)

### Bug Fixes

- update mute state only for video track on mobile ([#1645](https://github.com/GetStream/stream-video-js/issues/1645)) ([c0507cb](https://github.com/GetStream/stream-video-js/commit/c0507cb02e0058b8b968237220234771c9a30e6f)), closes [#1527](https://github.com/GetStream/stream-video-js/issues/1527)

## [1.15.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.14.0...@stream-io/video-client-1.15.0) (2025-01-15)

### Features

- Codec Negotiation ([#1527](https://github.com/GetStream/stream-video-js/issues/1527)) ([2e9e344](https://github.com/GetStream/stream-video-js/commit/2e9e344d5259e3069dddb17846013becef24829e))

## [1.14.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.13.1...@stream-io/video-client-1.14.0) (2025-01-02)

### Features

- **closed captions:** Integration in the SDKs ([#1508](https://github.com/GetStream/stream-video-js/issues/1508)) ([bcb8589](https://github.com/GetStream/stream-video-js/commit/bcb85892c0dafcb03f9debf8d2fd361622224166))

## [1.13.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.13.0...@stream-io/video-client-1.13.1) (2024-12-20)

### Bug Fixes

- **client:** fix the initial value of deviceState in clientDetails ([#1629](https://github.com/GetStream/stream-video-js/issues/1629)) ([afefb67](https://github.com/GetStream/stream-video-js/commit/afefb67a568899e2ce500e6dad36e64b6b0e5a3d))

## [1.13.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.12.4...@stream-io/video-client-1.13.0) (2024-12-20)

### Features

- report low power mode and thermal info to stats ([#1583](https://github.com/GetStream/stream-video-js/issues/1583)) ([ef49cee](https://github.com/GetStream/stream-video-js/commit/ef49ceef032fc3e4bb055fbc32c2b5b18c3a24d2))

## [1.12.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.12.3...@stream-io/video-client-1.12.4) (2024-12-17)

- improve test coverage reporting ([#1624](https://github.com/GetStream/stream-video-js/issues/1624)) ([32bb870](https://github.com/GetStream/stream-video-js/commit/32bb870187f0627c32d2b5692ce3de633d743582))

### Bug Fixes

- adjust dynascale debouncing for upscaling and downscaling ([#1621](https://github.com/GetStream/stream-video-js/issues/1621)) [skip ci] ([7b3a721](https://github.com/GetStream/stream-video-js/commit/7b3a72192fab79d8af8d1c392a9f0135e2d25b16))
- prevent auto-dropping already accepted or rejected calls ([#1619](https://github.com/GetStream/stream-video-js/issues/1619)) ([113406a](https://github.com/GetStream/stream-video-js/commit/113406a9ba7fdf2e193a1933b73963e0011f28f0))

## [1.12.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.12.2...@stream-io/video-client-1.12.3) (2024-12-13)

### Bug Fixes

- multiple rare ringing issues in react-native ([#1611](https://github.com/GetStream/stream-video-js/issues/1611)) ([4e25264](https://github.com/GetStream/stream-video-js/commit/4e25264808eab469b7b7ab184fb19961d47bdff3))

## [1.12.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.12.1...@stream-io/video-client-1.12.2) (2024-12-11)

- drop docusaurus docs ([#1613](https://github.com/GetStream/stream-video-js/issues/1613)) ([8743c8d](https://github.com/GetStream/stream-video-js/commit/8743c8d221191759266010c6cd053480da1d71a5))

### Bug Fixes

- pre-built timer worker ([#1617](https://github.com/GetStream/stream-video-js/issues/1617)) ([94dacef](https://github.com/GetStream/stream-video-js/commit/94dacef1c2b1e8794a42657ddab29a3b584eb0b4)), closes [#1557](https://github.com/GetStream/stream-video-js/issues/1557)

## [1.12.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.12.0...@stream-io/video-client-1.12.1) (2024-12-11)

### Bug Fixes

- reenable usage of ringing filters with useCalls ([1dffaed](https://github.com/GetStream/stream-video-js/commit/1dffaed609ac147a6030a4fb103c4dd586db775e))

## [1.12.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.15...@stream-io/video-client-1.12.0) (2024-12-10)

### Features

- Aggregate stats reports - request and response objects ([#1614](https://github.com/GetStream/stream-video-js/issues/1614)) ([8a47fea](https://github.com/GetStream/stream-video-js/commit/8a47fea491232e524b1de780c12c0d00e0f02bcd))

## [1.11.15](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.14...@stream-io/video-client-1.11.15) (2024-12-09)

### Bug Fixes

- avoid call.get in all call.ring events ([#1615](https://github.com/GetStream/stream-video-js/issues/1615)) ([c757370](https://github.com/GetStream/stream-video-js/commit/c7573701a20b4a29cd2b6fd08a55d4eff503f77f))

## [1.11.14](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.13...@stream-io/video-client-1.11.14) (2024-12-04)

### Bug Fixes

- prevent device list observable from erroring ([#1608](https://github.com/GetStream/stream-video-js/issues/1608)) ([06af3e7](https://github.com/GetStream/stream-video-js/commit/06af3e7e03b63551c781512c797ac10c0486d0c7))

## [1.11.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.12...@stream-io/video-client-1.11.13) (2024-12-03)

### Bug Fixes

- use worker to prevent timer throttling ([#1557](https://github.com/GetStream/stream-video-js/issues/1557)) ([c11c3ca](https://github.com/GetStream/stream-video-js/commit/c11c3caf455787fe531c83601bad71e7a0a0e9b9))

## [1.11.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.11...@stream-io/video-client-1.11.12) (2024-12-03)

### Bug Fixes

- handle timeout on SFU WS connections ([#1600](https://github.com/GetStream/stream-video-js/issues/1600)) ([5f2db7b](https://github.com/GetStream/stream-video-js/commit/5f2db7bd5cfdf57cdc04d6a6ed752f43e5b06657))

## [1.11.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.10...@stream-io/video-client-1.11.11) (2024-11-29)

### Bug Fixes

- revert [#1604](https://github.com/GetStream/stream-video-js/issues/1604) ([#1607](https://github.com/GetStream/stream-video-js/issues/1607)) ([567e4fb](https://github.com/GetStream/stream-video-js/commit/567e4fb309509b6b0d814826856d0a15efe16271))

## [1.11.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.9...@stream-io/video-client-1.11.10) (2024-11-28)

### Bug Fixes

- ringing calls not being left when ended ([#1601](https://github.com/GetStream/stream-video-js/issues/1601)) ([1c2b9d1](https://github.com/GetStream/stream-video-js/commit/1c2b9d1a54767652acc52cae9bb3d348c9df566f))

## [1.11.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.8...@stream-io/video-client-1.11.9) (2024-11-27)

### Bug Fixes

- cover some device selection edge cases ([#1604](https://github.com/GetStream/stream-video-js/issues/1604)) ([a8fc0ea](https://github.com/GetStream/stream-video-js/commit/a8fc0eaf1ed6c79ce24f77f52351a1e90701bd02))

## [1.11.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.7...@stream-io/video-client-1.11.8) (2024-11-27)

### Bug Fixes

- **ios:** use vp8 when h264 constrainted baseline isn't available ([#1597](https://github.com/GetStream/stream-video-js/issues/1597)) ([6281216](https://github.com/GetStream/stream-video-js/commit/62812161cef5e9917c504dbc4cd9257709ea5fa1))

## [1.11.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.6...@stream-io/video-client-1.11.7) (2024-11-26)

### Bug Fixes

- remove unused code from the coordinator websocket impl ([#1563](https://github.com/GetStream/stream-video-js/issues/1563)) ([921b820](https://github.com/GetStream/stream-video-js/commit/921b820133885dac299dab343cee3fc4b08705ce))

## [1.11.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.5...@stream-io/video-client-1.11.6) (2024-11-22)

### Bug Fixes

- force single codec preference in the SDP ([#1588](https://github.com/GetStream/stream-video-js/issues/1588)) ([4afff09](https://github.com/GetStream/stream-video-js/commit/4afff09a778f8567176d22bcc22d36001dca7cd3)), closes [#1581](https://github.com/GetStream/stream-video-js/issues/1581)

## [1.11.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.4...@stream-io/video-client-1.11.5) (2024-11-22)

### Bug Fixes

- unhandled promise rejections during reconnect ([#1585](https://github.com/GetStream/stream-video-js/issues/1585)) ([920c4ea](https://github.com/GetStream/stream-video-js/commit/920c4ea3b3f622430b35ac1bade74a6206ee17e5)), closes [/github.com/GetStream/stream-video-js/pull/1585/files#diff-420f6ddab47c1be72fd9ce8c99e1fa2b9f5f0495b7c367546ee0ff634beaed81](https://github.com/GetStream//github.com/GetStream/stream-video-js/pull/1585/files/issues/diff-420f6ddab47c1be72fd9ce8c99e1fa2b9f5f0495b7c367546ee0ff634beaed81)

## [1.11.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.3...@stream-io/video-client-1.11.4) (2024-11-21)

### Bug Fixes

- experimental option to force single codec preference in the SDP ([#1581](https://github.com/GetStream/stream-video-js/issues/1581)) ([894a86e](https://github.com/GetStream/stream-video-js/commit/894a86e407dc0dd36b7463bb964c86da0c3055d1))

## [1.11.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.2...@stream-io/video-client-1.11.3) (2024-11-20)

### Bug Fixes

- respect codec overrides when computing the video layers ([#1582](https://github.com/GetStream/stream-video-js/issues/1582)) ([c22b83e](https://github.com/GetStream/stream-video-js/commit/c22b83ef710f2188e680b73790154de046a824e9))

## [1.11.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.1...@stream-io/video-client-1.11.2) (2024-11-14)

### Bug Fixes

- fully reset token manager on user disconnect ([#1578](https://github.com/GetStream/stream-video-js/issues/1578)) ([6751abc](https://github.com/GetStream/stream-video-js/commit/6751abc0507085bd7c9f3f803f4c5929e0598bea)), closes [#1573](https://github.com/GetStream/stream-video-js/issues/1573)

## [1.11.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.11.0...@stream-io/video-client-1.11.1) (2024-11-14)

### Bug Fixes

- reject was not called on timeout, decline and cancel scenarios ([#1576](https://github.com/GetStream/stream-video-js/issues/1576)) ([8be76a4](https://github.com/GetStream/stream-video-js/commit/8be76a447729aeba7f5c68f8a9bb85b4738cb76d))

## [1.11.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.10.5...@stream-io/video-client-1.11.0) (2024-11-13)

### Features

- Connection timing ([#1574](https://github.com/GetStream/stream-video-js/issues/1574)) ([ce1dc9a](https://github.com/GetStream/stream-video-js/commit/ce1dc9a01fc5b0e60e3dac6653c27e99fd4b3ecb))

## [1.10.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.10.4...@stream-io/video-client-1.10.5) (2024-11-07)

### Bug Fixes

- ignore maxSimulcastLayers override for SVC codecs ([#1564](https://github.com/GetStream/stream-video-js/issues/1564)) ([48f8abe](https://github.com/GetStream/stream-video-js/commit/48f8abe5fd5b48c367a04696febd582573def828))

## [1.10.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.10.3...@stream-io/video-client-1.10.4) (2024-11-07)

### Bug Fixes

- max simulcast layers preference ([#1560](https://github.com/GetStream/stream-video-js/issues/1560)) ([2b0bf28](https://github.com/GetStream/stream-video-js/commit/2b0bf2824dce41c2709e361e0521cf85e1b2fd16))

## [1.10.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.10.2...@stream-io/video-client-1.10.3) (2024-11-05)

### Bug Fixes

- camera flip did not work in react-native ([#1554](https://github.com/GetStream/stream-video-js/issues/1554)) ([423890c](https://github.com/GetStream/stream-video-js/commit/423890cb2d1925366d8a63c29f93c4c92c8104ad)), closes [#1521](https://github.com/GetStream/stream-video-js/issues/1521)

## [1.10.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.10.1...@stream-io/video-client-1.10.2) (2024-11-01)

### Bug Fixes

- camera not enabled on foreground notifications ([#1546](https://github.com/GetStream/stream-video-js/issues/1546)) ([67c920a](https://github.com/GetStream/stream-video-js/commit/67c920ac4bca35a414b88f6c9829b08396a6260b))

## [1.10.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.10.0...@stream-io/video-client-1.10.1) (2024-10-30)

### Bug Fixes

- various device selector issues ([#1541](https://github.com/GetStream/stream-video-js/issues/1541)) ([f23618b](https://github.com/GetStream/stream-video-js/commit/f23618bda447eeb2d66f908bdb38b24db051f87c))

## [1.10.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.9.3...@stream-io/video-client-1.10.0) (2024-10-30)

### Features

- report input devices in call stats ([#1533](https://github.com/GetStream/stream-video-js/issues/1533)) ([f34fe0a](https://github.com/GetStream/stream-video-js/commit/f34fe0a0444903099565ae55a9639e39fc19b76c))

## [1.9.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.9.2...@stream-io/video-client-1.9.3) (2024-10-28)

### Bug Fixes

- make device selection by device id exact ([#1538](https://github.com/GetStream/stream-video-js/issues/1538)) ([6274cac](https://github.com/GetStream/stream-video-js/commit/6274cac2ecf155aa6ce0c6d764229e0e9cd39a6a))

## [1.9.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.9.1...@stream-io/video-client-1.9.2) (2024-10-21)

### Bug Fixes

- **client:** invoke call.reject only when reject param specified ([#1530](https://github.com/GetStream/stream-video-js/issues/1530)) ([eac4e4e](https://github.com/GetStream/stream-video-js/commit/eac4e4ebd2575f5269f65db7173107d5cafab9bf))

## [1.9.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.9.0...@stream-io/video-client-1.9.1) (2024-10-18)

### Bug Fixes

- **svc:** announce downscaled layers in setPublisher ([#1526](https://github.com/GetStream/stream-video-js/issues/1526)) ([96cadd0](https://github.com/GetStream/stream-video-js/commit/96cadd05e995392eac4ec300828d07b287d691a0))

## [1.9.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.8.4...@stream-io/video-client-1.9.0) (2024-10-16)

### Features

- **svc-codec:** VP9 and AV1 support ([#1434](https://github.com/GetStream/stream-video-js/issues/1434)) ([c9c8530](https://github.com/GetStream/stream-video-js/commit/c9c8530d48c9206dc3803e6aa6cc1859fd433920))

## [1.8.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.8.3...@stream-io/video-client-1.8.4) (2024-10-16)

### Bug Fixes

- ignore camera direction for desktop devices ([#1521](https://github.com/GetStream/stream-video-js/issues/1521)) ([562b5cc](https://github.com/GetStream/stream-video-js/commit/562b5cca77264330d08dff5305eccc489970076a))

## [1.8.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.8.2...@stream-io/video-client-1.8.3) (2024-10-10)

### Bug Fixes

- do not release track if track was not removed from stream ([#1517](https://github.com/GetStream/stream-video-js/issues/1517)) ([5bfc528](https://github.com/GetStream/stream-video-js/commit/5bfc52850c36ffe0de37e47066538a8a14dc9e01))

## [1.8.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.8.1...@stream-io/video-client-1.8.2) (2024-10-10)

### Bug Fixes

- add track release for react-native whenever track stop is called ([#1516](https://github.com/GetStream/stream-video-js/issues/1516)) ([5074510](https://github.com/GetStream/stream-video-js/commit/50745101d28d0339592c22ca02b076040ad3bdeb))

## [1.8.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.8.0...@stream-io/video-client-1.8.1) (2024-10-10)

### Bug Fixes

- mic not fully released in some cases ([#1515](https://github.com/GetStream/stream-video-js/issues/1515)) ([b7bf90b](https://github.com/GetStream/stream-video-js/commit/b7bf90b9b1a83fb80d01a82ebee8754343963ae5))

## [1.8.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.7.4...@stream-io/video-client-1.8.0) (2024-10-02)

### Features

- manual video quality selection ([#1486](https://github.com/GetStream/stream-video-js/issues/1486)) ([3a754af](https://github.com/GetStream/stream-video-js/commit/3a754afa1bd13d038b1023520ec8a5296ad2669e))

## [1.7.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.7.3...@stream-io/video-client-1.7.4) (2024-10-02)

### Bug Fixes

- retryable location hint ([#1505](https://github.com/GetStream/stream-video-js/issues/1505)) ([087417f](https://github.com/GetStream/stream-video-js/commit/087417f926b3d43a5bcb814ac9bb5951c1e63479))

## [1.7.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.7.2...@stream-io/video-client-1.7.3) (2024-09-24)

### Bug Fixes

- do not always error out api calls when web socket initially failed ([#1495](https://github.com/GetStream/stream-video-js/issues/1495)) ([7cdb62e](https://github.com/GetStream/stream-video-js/commit/7cdb62e75cad56098ee81eabbcc63382f93fd218))

## [1.7.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.7.1...@stream-io/video-client-1.7.2) (2024-09-20)

### Bug Fixes

- overridable bitrate and bitrate downscale factor ([#1493](https://github.com/GetStream/stream-video-js/issues/1493)) ([cce5d8e](https://github.com/GetStream/stream-video-js/commit/cce5d8e641a9182a1779952e4e62aa16ec21ab92))

## [1.7.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.7.0...@stream-io/video-client-1.7.1) (2024-09-20)

### Bug Fixes

- don't attempt to recover broken WebSockets when there isn't a network connection ([#1490](https://github.com/GetStream/stream-video-js/issues/1490)) ([d576f48](https://github.com/GetStream/stream-video-js/commit/d576f48c7f819d48008359a3c30fe5d1a3372145))

## [1.7.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.6.5...@stream-io/video-client-1.7.0) (2024-09-19)

### Features

- React SDK cold-start optimizations ([#1488](https://github.com/GetStream/stream-video-js/issues/1488)) ([972e579](https://github.com/GetStream/stream-video-js/commit/972e5792b5a131a212b1031ade76dcb383897a46))

## [1.6.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.6.4...@stream-io/video-client-1.6.5) (2024-09-19)

### Bug Fixes

- race condition in `applySettingsToStream` ([#1489](https://github.com/GetStream/stream-video-js/issues/1489)) ([bf2ad90](https://github.com/GetStream/stream-video-js/commit/bf2ad90224d88592d4ea27ea8d0683efe98771f7))

## [1.6.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.6.3...@stream-io/video-client-1.6.4) (2024-09-13)

### Bug Fixes

- allow video target bitrate override ([#1487](https://github.com/GetStream/stream-video-js/issues/1487)) ([bfe34a3](https://github.com/GetStream/stream-video-js/commit/bfe34a3609182da5bbb03331978d86569cada098))

## [1.6.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.6.2...@stream-io/video-client-1.6.3) (2024-09-11)

### Bug Fixes

- client instance removal used a wrong key ([#1484](https://github.com/GetStream/stream-video-js/issues/1484)) ([edff5d7](https://github.com/GetStream/stream-video-js/commit/edff5d7ca0cc241a3929da3b752073883f29da32))

## [1.6.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.6.1...@stream-io/video-client-1.6.2) (2024-09-09)

### Bug Fixes

- prioritize h264 baseline profile ([#1482](https://github.com/GetStream/stream-video-js/issues/1482)) ([3ea3c5e](https://github.com/GetStream/stream-video-js/commit/3ea3c5ecf57b50d3f909d59a96811f636b07d8aa))

## [1.6.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.6.0...@stream-io/video-client-1.6.1) (2024-09-05)

### Bug Fixes

- update state.endedAt after the SFU terminates the call ([#1477](https://github.com/GetStream/stream-video-js/issues/1477)) ([135b11f](https://github.com/GetStream/stream-video-js/commit/135b11f2e29f486f2f43b9ac2a84848d0fd0b5b4))

## [1.6.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.5.2...@stream-io/video-client-1.6.0) (2024-09-03)

- update node-sdk, add this to pronto for token generation ([#1472](https://github.com/GetStream/stream-video-js/issues/1472)) ([c6cbc1f](https://github.com/GetStream/stream-video-js/commit/c6cbc1f8d003ea1c39796ccbc87d7553604f819b))

### Features

- Reconnects v2 ([#1439](https://github.com/GetStream/stream-video-js/issues/1439)) ([e90aa52](https://github.com/GetStream/stream-video-js/commit/e90aa52780f9e0ca5852a294a152282000f66675))

### [1.5.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.5.1...@stream-io/video-client-1.5.2) (2024-08-23)

### Bug Fixes

- handle session_participant_count_updated
  event ([#1467](https://github.com/GetStream/stream-video-js/issues/1467)) ([55af565](https://github.com/GetStream/stream-video-js/commit/55af565ea259a7fcb4298f4df63d05e4b346ed5a))

### [1.5.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.5.0...@stream-io/video-client-1.5.1) (2024-08-23)

### Bug Fixes

- do not use ended_at from call state to check ringing
  validity ([#1466](https://github.com/GetStream/stream-video-js/issues/1466)) ([4af7f00](https://github.com/GetStream/stream-video-js/commit/4af7f0060db24923fb5dab43d1f2a709ef9acd29))

## [1.5.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.8...@stream-io/video-client-1.5.0) (2024-08-21)

### Features

- **client:** add a instance
  getter ([#1461](https://github.com/GetStream/stream-video-js/issues/1461)) ([7f4d836](https://github.com/GetStream/stream-video-js/commit/7f4d836511d9afdcd61bf5c6317611d3725953a6))

### [1.4.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.7...@stream-io/video-client-1.4.8) (2024-07-31)

### Bug Fixes

- `call.recording_failed` should update the call
  state ([#1452](https://github.com/GetStream/stream-video-js/issues/1452)) ([439b7f0](https://github.com/GetStream/stream-video-js/commit/439b7f0f53286c4ef3cc05a4bea4b1208e4e490e))

### [1.4.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.6...@stream-io/video-client-1.4.7) (2024-07-30)

### Bug Fixes

- ringing state issues when call was already
  ended ([#1451](https://github.com/GetStream/stream-video-js/issues/1451)) ([4a3556e](https://github.com/GetStream/stream-video-js/commit/4a3556e0f7b0bd58d0022cc635aa4391014063d7))

### [1.4.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.5...@stream-io/video-client-1.4.6) (2024-07-25)

### Bug Fixes

- allow joining left call
  instances ([#1448](https://github.com/GetStream/stream-video-js/issues/1448)) ([2f72300](https://github.com/GetStream/stream-video-js/commit/2f72300f9377eac774516cee3366c28e99840425)),
  closes [#1433](https://github.com/GetStream/stream-video-js/issues/1433)
- allow reusing call instances after
  leaving ([#1433](https://github.com/GetStream/stream-video-js/issues/1433)) ([61e05af](https://github.com/GetStream/stream-video-js/commit/61e05af25c441b7db9db16166a6b4eca20ec7748))

### [1.4.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.4...@stream-io/video-client-1.4.5) (2024-07-12)

### Bug Fixes

- report the Plain-JS sdk version to the
  SFU ([#1438](https://github.com/GetStream/stream-video-js/issues/1438)) ([7ac54e4](https://github.com/GetStream/stream-video-js/commit/7ac54e46c80288debbf99339e861fe7f6cdb0fdf))

### [1.4.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.3...@stream-io/video-client-1.4.4) (2024-07-02)

### Bug Fixes

- refactor background
  filters ([#1415](https://github.com/GetStream/stream-video-js/issues/1415)) ([deb6da2](https://github.com/GetStream/stream-video-js/commit/deb6da238f541c733451e84b198434671da8dceb))

### [1.4.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.2...@stream-io/video-client-1.4.3) (2024-06-25)

### Bug Fixes

- improve browser permission
  handling ([#1394](https://github.com/GetStream/stream-video-js/issues/1394)) ([c8ccb21](https://github.com/GetStream/stream-video-js/commit/c8ccb219a43464d1215987d99fd01d8b4a407eb5))

### [1.4.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.1...@stream-io/video-client-1.4.2) (2024-06-24)

### Bug Fixes

- support for portrait mode
  recording ([#1418](https://github.com/GetStream/stream-video-js/issues/1418)) ([70a304d](https://github.com/GetStream/stream-video-js/commit/70a304d3f20d93ecfffc97794e8e4974acf88e9a))

### [1.4.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.4.0...@stream-io/video-client-1.4.1) (2024-06-19)

### Bug Fixes

- perform full reconnect if ice restart
  fails ([#1408](https://github.com/GetStream/stream-video-js/issues/1408)) ([641df7e](https://github.com/GetStream/stream-video-js/commit/641df7e50522452171498a9cf3de893472fe7b7b))

## [1.4.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.3.1...@stream-io/video-client-1.4.0) (2024-06-19)

### Features

- **client:** support join_ahead_time_seconds field in the BackstageSettingsRequest
  struct ([#1397](https://github.com/GetStream/stream-video-js/issues/1397)) ([ded7a23](https://github.com/GetStream/stream-video-js/commit/ded7a23b1d112b496821bee95fe073f57bd51783))

### [1.3.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.3.0...@stream-io/video-client-1.3.1) (2024-06-12)

### Bug Fixes

- add concurrency
  helpers ([#1392](https://github.com/GetStream/stream-video-js/issues/1392)) ([b87068e](https://github.com/GetStream/stream-video-js/commit/b87068e14d40253a42d0383a4015c52be8f9c03b))

## [1.3.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.2.3...@stream-io/video-client-1.3.0) (2024-06-07)

### Features

- improve `isSupported` method for noise
  cancellation ([#1388](https://github.com/GetStream/stream-video-js/issues/1388)) ([07031ba](https://github.com/GetStream/stream-video-js/commit/07031ba72443a84cac8856c7481f3d4053b46d4c))

### [1.2.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.2.2...@stream-io/video-client-1.2.3) (2024-06-05)

### Bug Fixes

- catch error for user connect in
  constructor ([#1390](https://github.com/GetStream/stream-video-js/issues/1390)) ([9a69853](https://github.com/GetStream/stream-video-js/commit/9a69853bac33f70d62224e30a3df5e5383173940))

### [1.2.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.2.1...@stream-io/video-client-1.2.2) (2024-06-04)

### Bug Fixes

- align with the latest
  openapi ([#1384](https://github.com/GetStream/stream-video-js/issues/1384)) ([7c37e83](https://github.com/GetStream/stream-video-js/commit/7c37e8363ffc7e17e59de8357a2ed769e074bd8d))

### [1.2.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.2.0...@stream-io/video-client-1.2.1) (2024-06-04)

### Bug Fixes

- join doesn't work on chrome
  86 ([#1386](https://github.com/GetStream/stream-video-js/issues/1386)) ([7b462da](https://github.com/GetStream/stream-video-js/commit/7b462da8131e086f224c0590221d549a38ba419c))

## [1.2.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.1.0...@stream-io/video-client-1.2.0) (2024-06-03)

### Features

- **client:** support reject
  reason ([#1369](https://github.com/GetStream/stream-video-js/issues/1369)) ([decfc10](https://github.com/GetStream/stream-video-js/commit/decfc105c68867977c8a9a6484475b805583b446))

## [1.1.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.10...@stream-io/video-client-1.1.0) (2024-06-03)

### Features

- video filters on
  android ([#1382](https://github.com/GetStream/stream-video-js/issues/1382)) ([7ba8b0e](https://github.com/GetStream/stream-video-js/commit/7ba8b0e3b444869d38aae1a045dffb05444643f5))

### [1.0.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.9...@stream-io/video-client-1.0.10) (2024-05-31)

### Bug Fixes

- improved input device error
  handling ([#1378](https://github.com/GetStream/stream-video-js/issues/1378)) ([90abc38](https://github.com/GetStream/stream-video-js/commit/90abc38762acc4b8095c281b3b06b1fc8237ec15))

### [1.0.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.8...@stream-io/video-client-1.0.9) (2024-05-29)

### Bug Fixes

- prevent double sound detectors set
  up ([#1371](https://github.com/GetStream/stream-video-js/issues/1371)) ([51c9198](https://github.com/GetStream/stream-video-js/commit/51c9198a96b956884554bc508e38c90af0cee30f))

### [1.0.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.7...@stream-io/video-client-1.0.8) (2024-05-23)

### Bug Fixes

- call.reject when there is no participant and call is in joined
  state ([#1366](https://github.com/GetStream/stream-video-js/issues/1366)) ([308d045](https://github.com/GetStream/stream-video-js/commit/308d0452303743922ca1e982bd271b42857d96b3))

### [1.0.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.6...@stream-io/video-client-1.0.7) (2024-05-21)

### Bug Fixes

- align with the latest
  openapi ([#1343](https://github.com/GetStream/stream-video-js/issues/1343)) ([2cb71cc](https://github.com/GetStream/stream-video-js/commit/2cb71cc599f46e248a4af9b4ea79f5938d7c508c))

### [1.0.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.5...@stream-io/video-client-1.0.6) (2024-05-16)

### Bug Fixes

- **state:** aligns the participant state with other
  SDKs ([#1357](https://github.com/GetStream/stream-video-js/issues/1357)) ([146e6ac](https://github.com/GetStream/stream-video-js/commit/146e6acd7296488bc18f4bf5c76e9f2c9bfd97af))

### [1.0.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.4...@stream-io/video-client-1.0.5) (2024-05-16)

### Bug Fixes

- correctly handle pending state
  reset ([4ea47da](https://github.com/GetStream/stream-video-js/commit/4ea47da969f00925e1df144ec2f33cd07ac2f63f))

### [1.0.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.3...@stream-io/video-client-1.0.4) (2024-05-14)

### Bug Fixes

- don't create publisher PC for anonymous
  users ([#1353](https://github.com/GetStream/stream-video-js/issues/1353)) ([7331767](https://github.com/GetStream/stream-video-js/commit/7331767bd9254082517b1f36895796032b7af149))

### [1.0.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.2...@stream-io/video-client-1.0.3) (2024-05-13)

### Bug Fixes

- improve error handling across the
  SDK ([#1350](https://github.com/GetStream/stream-video-js/issues/1350)) ([ac0ae3b](https://github.com/GetStream/stream-video-js/commit/ac0ae3b7d5da91152d0f41a203b73e6c99c42ff9))

### [1.0.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.1...@stream-io/video-client-1.0.2) (2024-05-13)

### Bug Fixes

- optimistically toggle device
  status ([#1342](https://github.com/GetStream/stream-video-js/issues/1342)) ([2e4e470](https://github.com/GetStream/stream-video-js/commit/2e4e470347fce7c7499dd21a931e5dec74bf9618))

### [1.0.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-1.0.0...@stream-io/video-client-1.0.1) (2024-05-07)

### Bug Fixes

- **state:** handle participantUpdated
  event ([#1341](https://github.com/GetStream/stream-video-js/issues/1341)) ([96cb99f](https://github.com/GetStream/stream-video-js/commit/96cb99fe2b661e3f4899a7c16b4159cad7a085c6))

## [1.0.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.8.0...@stream-io/video-client-1.0.0) (2024-05-07)

### Features

- **v1:** release
  v1.0.0 ([06174cd](https://github.com/GetStream/stream-video-js/commit/06174cdfb4168a7401f56b03d0302f82c97b93ff))

## [0.8.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.13...@stream-io/video-client-0.8.0) (2024-05-07)

### Features

- **v1:** release
  v1.0.0 ([#1340](https://github.com/GetStream/stream-video-js/issues/1340)) ([f76fd02](https://github.com/GetStream/stream-video-js/commit/f76fd02ec2159bb0943c8432591b462ab0d356ff))

### [0.7.13](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.12...@stream-io/video-client-0.7.13) (2024-05-07)

### Bug Fixes

- change log level of send stats SFU API to type
  debug ([#1338](https://github.com/GetStream/stream-video-js/issues/1338)) ([76e43ad](https://github.com/GetStream/stream-video-js/commit/76e43adbff1d54e1b0b5548dabf550cd9044d9dc))

### [0.7.12](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.11...@stream-io/video-client-0.7.12) (2024-05-03)

### Features

- support target_resolution backend setting for
  screensharing ([#1336](https://github.com/GetStream/stream-video-js/issues/1336)) ([1e9f796](https://github.com/GetStream/stream-video-js/commit/1e9f7963009ac7fc27ee24abc00eb68749cc19d8))

### [0.7.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.10...@stream-io/video-client-0.7.11) (2024-05-03)

### Bug Fixes

- **devices:** API to disable speaking while muted
  notifications ([#1335](https://github.com/GetStream/stream-video-js/issues/1335)) ([cdff0e0](https://github.com/GetStream/stream-video-js/commit/cdff0e036bf4afca763e4f7a1563c23e806be190)),
  closes [#1329](https://github.com/GetStream/stream-video-js/issues/1329)

### [0.7.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.9...@stream-io/video-client-0.7.10) (2024-04-30)

### Bug Fixes

- **state:** optimized Call State
  updates ([#1330](https://github.com/GetStream/stream-video-js/issues/1330)) ([e5f9f88](https://github.com/GetStream/stream-video-js/commit/e5f9f882df95761bfecbd6b38832f013b0e7a75e))

### [0.7.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.8...@stream-io/video-client-0.7.9) (2024-04-26)

### Bug Fixes

- update call state with transcription
  events ([ab933ae](https://github.com/GetStream/stream-video-js/commit/ab933aee820fae199935380c7bab6edc7790f0ca))

### [0.7.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.7...@stream-io/video-client-0.7.8) (2024-04-25)

### Features

- Noise
  Cancellation ([#1321](https://github.com/GetStream/stream-video-js/issues/1321)) ([9144385](https://github.com/GetStream/stream-video-js/commit/91443852986ad7453d82efb900626266d8df0e96))

### [0.7.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.6...@stream-io/video-client-0.7.7) (2024-04-23)

### Features

- **feedback:** Collect user
  feedback ([#1324](https://github.com/GetStream/stream-video-js/issues/1324)) ([b415de0](https://github.com/GetStream/stream-video-js/commit/b415de0828e402f8d3b854553351843aad2e8473))

### [0.7.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.5...@stream-io/video-client-0.7.6) (2024-04-23)

### Bug Fixes

- **client:** ignore SFU WS status code when the user initiates leaving a
  call ([#1323](https://github.com/GetStream/stream-video-js/issues/1323)) ([774882b](https://github.com/GetStream/stream-video-js/commit/774882b9e2bb3f3dc72401278c174e1a0f597ce1))

### [0.7.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.4...@stream-io/video-client-0.7.5) (2024-04-23)

### Bug Fixes

- **publisher:** ensure initial bitrate is
  set ([#1322](https://github.com/GetStream/stream-video-js/issues/1322)) ([d7e8e4e](https://github.com/GetStream/stream-video-js/commit/d7e8e4e5cb3ff9859c1eb580162ed88bbe54b096))

### [0.7.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.3...@stream-io/video-client-0.7.4) (2024-04-17)

### Features

- update from
  OpenAPI ([#1320](https://github.com/GetStream/stream-video-js/issues/1320)) ([391c030](https://github.com/GetStream/stream-video-js/commit/391c030ba71a2e12001eaa195226dcece44f3922))

### [0.7.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.2...@stream-io/video-client-0.7.3) (2024-04-17)

### Bug Fixes

- **codecs:** Set codec preferences based on receiving
  capabilities ([#1318](https://github.com/GetStream/stream-video-js/issues/1318)) ([43087fe](https://github.com/GetStream/stream-video-js/commit/43087fed8e844ad9c80a5b4849500eedc8301609))

### [0.7.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.1...@stream-io/video-client-0.7.2) (2024-04-16)

### Features

- update coordinator
  models ([#1317](https://github.com/GetStream/stream-video-js/issues/1317)) ([cdbee74](https://github.com/GetStream/stream-video-js/commit/cdbee747f1730f6965315e7c9ea9426287ff0cfd))

### [0.7.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.7.0...@stream-io/video-client-0.7.1) (2024-04-09)

### Features

- user
  feedback ([#1310](https://github.com/GetStream/stream-video-js/issues/1310)) ([256b775](https://github.com/GetStream/stream-video-js/commit/256b7756e89b261e0efa37952611139bf94a641e))

## [0.7.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.10...@stream-io/video-client-0.7.0) (2024-04-09)

### ⚠ BREAKING CHANGES

- remove server-side capabilities from JS client (#1282)

### Features

- remove server-side capabilities from JS
  client ([#1282](https://github.com/GetStream/stream-video-js/issues/1282)) ([362b6b5](https://github.com/GetStream/stream-video-js/commit/362b6b501e6aa1864eb8486e3129a1705a4d41fb))

### [0.6.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.9...@stream-io/video-client-0.6.10) (2024-04-05)

### Features

- revert add submit feedback method to
  Call ([#1307](https://github.com/GetStream/stream-video-js/issues/1307)) ([#1308](https://github.com/GetStream/stream-video-js/issues/1308)) ([df9a74d](https://github.com/GetStream/stream-video-js/commit/df9a74dddf0287812b723d134d92941ac939bb9f))

### [0.6.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.8...@stream-io/video-client-0.6.9) (2024-04-05)

### Features

- add submit feedback method to
  Call ([#1307](https://github.com/GetStream/stream-video-js/issues/1307)) ([45fb9da](https://github.com/GetStream/stream-video-js/commit/45fb9da6eb52e4509c7b45b53cd62b0af6f7ec74))

### [0.6.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.7...@stream-io/video-client-0.6.8) (2024-04-05)

### Features

- **react:** Support for Background Filters and Background
  Blurring ([#1283](https://github.com/GetStream/stream-video-js/issues/1283)) ([f790ee7](https://github.com/GetStream/stream-video-js/commit/f790ee78c20fb0f5266e429a777d8bb7ef158c83)),
  closes [#1271](https://github.com/GetStream/stream-video-js/issues/1271) [#1276](https://github.com/GetStream/stream-video-js/issues/1276)

### [0.6.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.6...@stream-io/video-client-0.6.7) (2024-04-02)

### Features

- [PBE-1611] Query call reports
  endpoint ([#1306](https://github.com/GetStream/stream-video-js/issues/1306)) ([0861a5d](https://github.com/GetStream/stream-video-js/commit/0861a5dd6e6e56c4ae286c44f174a319e8f308c4))

### [0.6.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.5...@stream-io/video-client-0.6.6) (2024-03-29)

### Features

- **client:** update to the latest
  OpenAPI ([#1301](https://github.com/GetStream/stream-video-js/issues/1301)) ([f195011](https://github.com/GetStream/stream-video-js/commit/f1950111cde0d9a91e6abd69395c858ac55c624c))

### [0.6.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.4...@stream-io/video-client-0.6.5) (2024-03-29)

### Bug Fixes

- various bug fixes and
  improvements ([#1300](https://github.com/GetStream/stream-video-js/issues/1300)) ([a6186e2](https://github.com/GetStream/stream-video-js/commit/a6186e2406fd0b3e0aaa51a4222fa2e24e9dfac3))

### [0.6.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.3...@stream-io/video-client-0.6.4) (2024-03-28)

### Bug Fixes

- **react-native:** improve error logging for speaker manager hook and improve usage of incall manager in
  SDK ([#1299](https://github.com/GetStream/stream-video-js/issues/1299)) ([9527c41](https://github.com/GetStream/stream-video-js/commit/9527c4176d4e46224ddec18e3fddfb404e0aaae5))

### [0.6.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.2...@stream-io/video-client-0.6.3) (2024-03-25)

### Features

- SFU stats
  reporting ([#1297](https://github.com/GetStream/stream-video-js/issues/1297)) ([f46e927](https://github.com/GetStream/stream-video-js/commit/f46e927cbd650bc9af64a01cd5ebcec6cf2cfda8)),
  closes [#1276](https://github.com/GetStream/stream-video-js/issues/1276)

### [0.6.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.1...@stream-io/video-client-0.6.2) (2024-03-25)

### Features

- **call:** Add getCallStats
  method ([#1296](https://github.com/GetStream/stream-video-js/issues/1296)) ([b64a19e](https://github.com/GetStream/stream-video-js/commit/b64a19ecd2fcc74f5f531397ed34732d55b0f815))

### [0.6.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.6.0...@stream-io/video-client-0.6.1) (2024-03-13)

### Features

- **speakers:** Participant audio output
  levels ([#1284](https://github.com/GetStream/stream-video-js/issues/1284)) ([63b6077](https://github.com/GetStream/stream-video-js/commit/63b607709fd65019fe320e5970aab8132053995c))

## [0.6.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.11...@stream-io/video-client-0.6.0) (2024-02-26)

### ⚠ BREAKING CHANGES

- **events:** improved type narrowing on call events (#1246)
- **react-sdk:** Visual redesign of the SDK and Demo App (#1194)

### Features

- **events:** improved type narrowing on call
  events ([#1246](https://github.com/GetStream/stream-video-js/issues/1246)) ([b5bdab1](https://github.com/GetStream/stream-video-js/commit/b5bdab1b526b451402867a849f5790f4f9a9fa1e))
- **react-sdk:** Visual redesign of the SDK and Demo
  App ([#1194](https://github.com/GetStream/stream-video-js/issues/1194)) ([c1c6a7b](https://github.com/GetStream/stream-video-js/commit/c1c6a7b9bb0551442457f6d0ef5fedc92a985a3d))

### Bug Fixes

- **permissions:** relax device permission handling for
  Safari ([#1248](https://github.com/GetStream/stream-video-js/issues/1248)) ([39dc231](https://github.com/GetStream/stream-video-js/commit/39dc23175d0c892228b195fc77083d9bc256e1fb))

### [0.5.11](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.10...@stream-io/video-client-0.5.11) (2024-02-19)

### Bug Fixes

- **client:** add workaround for missing getConfiguration support in react native
  webrtc ([#1269](https://github.com/GetStream/stream-video-js/issues/1269)) ([ac163de](https://github.com/GetStream/stream-video-js/commit/ac163de4d89e86b4900c885baef564fdaf6b7bac))

### [0.5.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.9...@stream-io/video-client-0.5.10) (2024-02-16)

### Bug Fixes

- **client:** do not set h264 as preference for
  iphone ([a014ab0](https://github.com/GetStream/stream-video-js/commit/a014ab0e5e2907d39fac45079d64d12997e2a63e))

### [0.5.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.8...@stream-io/video-client-0.5.9) (2024-02-12)

### Features

- **client:** add stopOnLeave param to device
  manager ([#1266](https://github.com/GetStream/stream-video-js/issues/1266)) ([2d0a865](https://github.com/GetStream/stream-video-js/commit/2d0a865e1f3d5a72df6bc528eb0ed5e2494eb734)),
  closes [#1236](https://github.com/GetStream/stream-video-js/issues/1236)

### [0.5.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.7...@stream-io/video-client-0.5.8) (2024-02-06)

### Features

- external storage for
  recordings ([#1260](https://github.com/GetStream/stream-video-js/issues/1260)) ([50a45fc](https://github.com/GetStream/stream-video-js/commit/50a45fc6b87865f16301d6a9173c59e4774a3b31))

### [0.5.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.6...@stream-io/video-client-0.5.7) (2024-01-29)

### Bug Fixes

- **react-native:** no video stream from
  ipad ([#1253](https://github.com/GetStream/stream-video-js/issues/1253)) ([3e325ba](https://github.com/GetStream/stream-video-js/commit/3e325ba6063d7452b25bbf88829e2d8155979e6f))

### [0.5.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.5...@stream-io/video-client-0.5.6) (2024-01-19)

### Bug Fixes

- **client:** automatic call join for other participants when someone
  accepts ([#1247](https://github.com/GetStream/stream-video-js/issues/1247)) ([3559ff2](https://github.com/GetStream/stream-video-js/commit/3559ff209616ccfc4664b24e6a4f35c153be2090)),
  closes [#1245](https://github.com/GetStream/stream-video-js/issues/1245)

### [0.5.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.4...@stream-io/video-client-0.5.5) (2024-01-16)

### Bug Fixes

- **sfu:** ensure SFU WebSocket is
  closed ([#1242](https://github.com/GetStream/stream-video-js/issues/1242)) ([3f99206](https://github.com/GetStream/stream-video-js/commit/3f9920616c26770911ebbc54d50dc50f4ca219e2)),
  closes [#1212](https://github.com/GetStream/stream-video-js/issues/1212)

### [0.5.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.3...@stream-io/video-client-0.5.4) (2024-01-16)

### Bug Fixes

- **ring calls:** cancel auto-drop after rejecting a
  call ([#1241](https://github.com/GetStream/stream-video-js/issues/1241)) ([67a2aae](https://github.com/GetStream/stream-video-js/commit/67a2aaee658cbe759fbda4d3c924f33e872cd00e))

### [0.5.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.2...@stream-io/video-client-0.5.3) (2023-12-22)

### Features

- Fast
  Reconnection ([#1220](https://github.com/GetStream/stream-video-js/issues/1220)) ([5673d67](https://github.com/GetStream/stream-video-js/commit/5673d67ecec3b6808450e2892fa93214c26960a8)),
  closes [#1212](https://github.com/GetStream/stream-video-js/issues/1212)

### [0.5.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.1...@stream-io/video-client-0.5.2) (2023-12-11)

### Bug Fixes

- **ringing:** Auto-Cancel outgoing
  calls ([#1217](https://github.com/GetStream/stream-video-js/issues/1217)) ([c4d557b](https://github.com/GetStream/stream-video-js/commit/c4d557b736df8ff0a95166d1f9f0a52d4a57a122)),
  closes [#1215](https://github.com/GetStream/stream-video-js/issues/1215)

### [0.5.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.5.0...@stream-io/video-client-0.5.1) (2023-12-05)

### Features

- **client:** speaking while muted in React Native using temporary peer
  connection ([#1207](https://github.com/GetStream/stream-video-js/issues/1207)) ([9093006](https://github.com/GetStream/stream-video-js/commit/90930063503b6dfb83572dad8a31e45b16bf1685))

## [0.5.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.10...@stream-io/video-client-0.5.0) (2023-11-29)

### ⚠ BREAKING CHANGES

- **react-native:** move to webrtc 118 (#1197)

### Features

- **react-native:** move to webrtc
  118 ([#1197](https://github.com/GetStream/stream-video-js/issues/1197)) ([8cdbe11](https://github.com/GetStream/stream-video-js/commit/8cdbe11de069fcb6eae5643f5cef5c9612f6c805))

### [0.4.10](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.9...@stream-io/video-client-0.4.10) (2023-11-27)

### Bug Fixes

- **session:** prevent duplication of session
  participants ([#1201](https://github.com/GetStream/stream-video-js/issues/1201)) ([2d0131e](https://github.com/GetStream/stream-video-js/commit/2d0131e8f97216b90d873b91282006e428e40ac0))

### [0.4.9](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.8...@stream-io/video-client-0.4.9) (2023-11-22)

### Features

- **participant-view:** allow opting-out from rendering
  VideoPlaceholder ([#1198](https://github.com/GetStream/stream-video-js/issues/1198)) ([acb020c](https://github.com/GetStream/stream-video-js/commit/acb020c8157a1338771bef11ef5e501bc9cd6f69))

### [0.4.8](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.7...@stream-io/video-client-0.4.8) (2023-11-16)

### Bug Fixes

- **device-api:** check for Permissions API
  availability ([#1193](https://github.com/GetStream/stream-video-js/issues/1193)) ([5ffeaa0](https://github.com/GetStream/stream-video-js/commit/5ffeaa0d2abdab401f9028a14b114d00723605c1)),
  closes [#1184](https://github.com/GetStream/stream-video-js/issues/1184)

### [0.4.7](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.6...@stream-io/video-client-0.4.7) (2023-11-13)

### Features

- **device-api:** Browser Permissions
  API ([#1184](https://github.com/GetStream/stream-video-js/issues/1184)) ([a0b3573](https://github.com/GetStream/stream-video-js/commit/a0b3573b630ff8450953cdf1102fe722aea83f6f))

### [0.4.6](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.5...@stream-io/video-client-0.4.6) (2023-11-13)

### Features

- handle device
  disconnection ([#1174](https://github.com/GetStream/stream-video-js/issues/1174)) ([ae3779f](https://github.com/GetStream/stream-video-js/commit/ae3779fbfd820d8ef85ad58dafb698e06c00a3e3))

### [0.4.5](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.4...@stream-io/video-client-0.4.5) (2023-11-07)

### Bug Fixes

- lift the debug helpers from the SDK to
  Pronto ([#1182](https://github.com/GetStream/stream-video-js/issues/1182)) ([8f31efc](https://github.com/GetStream/stream-video-js/commit/8f31efc71d9f85ef147d21b42f23876599c36072))

### [0.4.4](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.3...@stream-io/video-client-0.4.4) (2023-11-02)

### Bug Fixes

- allow audio and screen share audio tracks, delay
  setSinkId ([#1176](https://github.com/GetStream/stream-video-js/issues/1176)) ([6a099c5](https://github.com/GetStream/stream-video-js/commit/6a099c5c7cc6f5d389961a7c594e914e19be4ddb))

### [0.4.3](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.2...@stream-io/video-client-0.4.3) (2023-11-01)

### Bug Fixes

- **client:** optimized device
  enumeration ([#1111](https://github.com/GetStream/stream-video-js/issues/1111)) ([435bd33](https://github.com/GetStream/stream-video-js/commit/435bd33afbe8b368413690f8f2d67d0b4918dbaa))

### [0.4.2](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.1...@stream-io/video-client-0.4.2) (2023-11-01)

### Bug Fixes

- respect server-side settings in the
  lobby ([#1175](https://github.com/GetStream/stream-video-js/issues/1175)) ([b722a0a](https://github.com/GetStream/stream-video-js/commit/b722a0a4f8fd4e4e56787db3d9a56e45ee195974))

### [0.4.1](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.4.0...@stream-io/video-client-0.4.1) (2023-10-30)

### Features

- Apply device config settings when call state becomes
  available ([#1167](https://github.com/GetStream/stream-video-js/issues/1167)) ([38e8ba4](https://github.com/GetStream/stream-video-js/commit/38e8ba459b60d9705af96ad7b9a2a7fa1827ad1e))

## [0.4.0](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.36...@stream-io/video-client-0.4.0) (2023-10-27)

### ⚠ BREAKING CHANGES

- **react-sdk:** Universal Device Management API (#1127)

### Features

- **react-sdk:** Universal Device Management
  API ([#1127](https://github.com/GetStream/stream-video-js/issues/1127)) ([aeb3561](https://github.com/GetStream/stream-video-js/commit/aeb35612745f45254b536281c5f81d1bcac2bab5))

### [0.3.36](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.35...@stream-io/video-client-0.3.36) (2023-10-25)

### Features

- **dynascale:** pick scaleResolutionDownBy parameter from the changePublishQuality
  message ([#1113](https://github.com/GetStream/stream-video-js/issues/1113)) ([81b91d4](https://github.com/GetStream/stream-video-js/commit/81b91d48ca90a74f6af4b879c553ff2575dcb5bb))

### [0.3.35](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.34...@stream-io/video-client-0.3.35) (2023-10-19)

### Features

- mute screenshare_audio, update to the newest OpenAPI
  schema ([#1148](https://github.com/GetStream/stream-video-js/issues/1148)) ([81c45a7](https://github.com/GetStream/stream-video-js/commit/81c45a77e6a526de05ce5457357d212fb3e613d9))

### [0.3.34](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.33...@stream-io/video-client-0.3.34) (2023-10-18)

### Features

- **build:** ESM and CJS
  bundles ([#1144](https://github.com/GetStream/stream-video-js/issues/1144)) ([58b60ee](https://github.com/GetStream/stream-video-js/commit/58b60eee4b1cd667d2eef8f17ed4e6da74876a51)),
  closes [#1025](https://github.com/GetStream/stream-video-js/issues/1025)

### [0.3.33](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.32...@stream-io/video-client-0.3.33) (2023-10-13)

### Bug Fixes

- **client:** disable server side
  tests ([#1143](https://github.com/GetStream/stream-video-js/issues/1143)) ([68043f3](https://github.com/GetStream/stream-video-js/commit/68043f35630a94f0097dafcee74afe67e1e6054f))

### [0.3.32](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.31...@stream-io/video-client-0.3.32) (2023-10-13)

### Bug Fixes

- **client:** skip broken update call types
  test ([#1142](https://github.com/GetStream/stream-video-js/issues/1142)) ([e1d5837](https://github.com/GetStream/stream-video-js/commit/e1d5837140b19398a42b9c57b6b6bbfafd52bc21))

### [0.3.31](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.30...@stream-io/video-client-0.3.31) (2023-10-09)

### Bug Fixes

- sorting in paginated
  grid ([#1129](https://github.com/GetStream/stream-video-js/issues/1129)) ([d5b280a](https://github.com/GetStream/stream-video-js/commit/d5b280aadeaa4c718d0158561197c7045620ae0f))

### [0.3.30](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.29...@stream-io/video-client-0.3.30) (2023-10-06)

### Features

- ScreenShare Audio
  support ([#1118](https://github.com/GetStream/stream-video-js/issues/1118)) ([5b63e1c](https://github.com/GetStream/stream-video-js/commit/5b63e1c5f52c76e3761e6907bd3786c19f0e5c6d))

### [0.3.29](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.28...@stream-io/video-client-0.3.29) (2023-10-05)

### Bug Fixes

- ensure stable
  sort ([#1130](https://github.com/GetStream/stream-video-js/issues/1130)) ([f96e1af](https://github.com/GetStream/stream-video-js/commit/f96e1af33ef9e60434e07dc0fba5161f20b8eba6))

### [0.3.28](https://github.com/GetStream/stream-video-js/compare/@stream-io/video-client-0.3.27...@stream-io/video-client-0.3.28) (2023-09-28)

### Bug Fixes

- use `@stream-io/video-client` as a tag
  prefix ([#1116](https://github.com/GetStream/stream-video-js/issues/1116)) ([418206a](https://github.com/GetStream/stream-video-js/commit/418206aaa3a013e0d551e109d8243e75a053d5a3))

### [0.3.27](https://github.com/GetStream/stream-video-js/compare/client0.3.26...client0.3.27) (2023-09-28)

### Bug Fixes

- use `@types/ws` as a regular
  dependency ([#1115](https://github.com/GetStream/stream-video-js/issues/1115)) ([bafad33](https://github.com/GetStream/stream-video-js/commit/bafad3317b7b899b4f2a6a3fdf3b051ad4c96c34))

### [0.3.26](https://github.com/GetStream/stream-video-js/compare/client0.3.25...client0.3.26) (2023-09-27)

### Features

- **Call Preview:** Support for call
  thumbnails ([#1099](https://github.com/GetStream/stream-video-js/issues/1099)) ([9274f76](https://github.com/GetStream/stream-video-js/commit/9274f760ed264ee0ee6ac97c6fe679288e067fd8))

### [0.3.25](https://github.com/GetStream/stream-video-js/compare/client0.3.24...client0.3.25) (2023-09-27)

### Features

- **react-sdk:**
  LivestreamLayout ([#1103](https://github.com/GetStream/stream-video-js/issues/1103)) ([6636699](https://github.com/GetStream/stream-video-js/commit/6636699701dfd5eb5886c50781dd5f16a8470da5))

### [0.3.24](https://github.com/GetStream/stream-video-js/compare/client0.3.23...client0.3.24) (2023-09-26)

### Features

- **client:** share replay of computed
  observables ([#1095](https://github.com/GetStream/stream-video-js/issues/1095)) ([759d9a2](https://github.com/GetStream/stream-video-js/commit/759d9a2c403aa11a64e5470aa53622022918e24e))

### [0.3.23](https://github.com/GetStream/stream-video-js/compare/client0.3.22...client0.3.23) (2023-09-26)

### Bug Fixes

- add type check of deviceId before setting
  sinkId ([#1108](https://github.com/GetStream/stream-video-js/issues/1108)) ([705515e](https://github.com/GetStream/stream-video-js/commit/705515e5f63a35286fdb45725b9e299afe09c9bb))

### [0.3.22](https://github.com/GetStream/stream-video-js/compare/client0.3.21...client0.3.22) (2023-09-25)

### Bug Fixes

- Add extra delay before attempting to play video in Safari and
  Firefox ([#1106](https://github.com/GetStream/stream-video-js/issues/1106)) ([5b4a589](https://github.com/GetStream/stream-video-js/commit/5b4a58918240a7b63807726609d6d54b92cfe1d2))

### [0.3.21](https://github.com/GetStream/stream-video-js/compare/client0.3.20...client0.3.21) (2023-09-20)

### Bug Fixes

- unmount video element when there is no video track or participant is
  invisible ([#1096](https://github.com/GetStream/stream-video-js/issues/1096)) ([bd01835](https://github.com/GetStream/stream-video-js/commit/bd01835f4e93c981ca2e5a7e4e09142ea4e326cf)),
  closes [#1094](https://github.com/GetStream/stream-video-js/issues/1094)

### [0.3.20](https://github.com/GetStream/stream-video-js/compare/client0.3.19...client0.3.20) (2023-09-19)

### Features

- Update with new API
  spec ([#1098](https://github.com/GetStream/stream-video-js/issues/1098)) ([ced372c](https://github.com/GetStream/stream-video-js/commit/ced372ca068086375024d59a977014efcadefef2))

### [0.3.19](https://github.com/GetStream/stream-video-js/compare/client0.3.18...client0.3.19) (2023-09-15)

### Bug Fixes

- initial device state
  handling ([#1092](https://github.com/GetStream/stream-video-js/issues/1092)) ([a98d07f](https://github.com/GetStream/stream-video-js/commit/a98d07f9e3eaf6bb059911538ba2a64a1550e53d))

### [0.3.18](https://github.com/GetStream/stream-video-js/compare/client0.3.17...client0.3.18) (2023-09-15)

### Bug Fixes

- **DynascaleManager:** update subscription upon
  cleanup ([#1089](https://github.com/GetStream/stream-video-js/issues/1089)) ([bad8ac1](https://github.com/GetStream/stream-video-js/commit/bad8ac1651594b237b96987521000008753a80a5))

### [0.3.17](https://github.com/GetStream/stream-video-js/compare/client0.3.16...client0.3.17) (2023-09-14)

### Features

- speaking while muted
  notification ([#1011](https://github.com/GetStream/stream-video-js/issues/1011)) ([b17600c](https://github.com/GetStream/stream-video-js/commit/b17600c626a55f1ef4c7abacab6e02d38e3263b7))

### [0.3.16](https://github.com/GetStream/stream-video-js/compare/client0.3.15...client0.3.16) (2023-09-13)

### Features

- restore remote muting
  functionality ([#1078](https://github.com/GetStream/stream-video-js/issues/1078)) ([091d444](https://github.com/GetStream/stream-video-js/commit/091d4440a423e5f265e6fd6b1ceea32a447de93a)),
  closes [#1070](https://github.com/GetStream/stream-video-js/issues/1070) [#988](https://github.com/GetStream/stream-video-js/issues/988)

### [0.3.15](https://github.com/GetStream/stream-video-js/compare/client0.3.14...client0.3.15) (2023-09-11)

### Bug Fixes

- consider prior track publishing state before applying soft
  mutes ([#1070](https://github.com/GetStream/stream-video-js/issues/1070)) ([f542409](https://github.com/GetStream/stream-video-js/commit/f542409c641417bbbe6f0997d77e34684b881bfb)),
  closes [#988](https://github.com/GetStream/stream-video-js/issues/988)

### [0.3.14](https://github.com/GetStream/stream-video-js/compare/client0.3.13...client0.3.14) (2023-09-05)

### Features

- new device api remote
  mutes ([#988](https://github.com/GetStream/stream-video-js/issues/988)) ([5bbcefb](https://github.com/GetStream/stream-video-js/commit/5bbcefbf0d8be59025fef8111253a8a0baaf6001))

### [0.3.13](https://github.com/GetStream/stream-video-js/compare/client0.3.12...client0.3.13) (2023-08-31)

### Features

- speaker
  management ([#1013](https://github.com/GetStream/stream-video-js/issues/1013)) ([05af437](https://github.com/GetStream/stream-video-js/commit/05af437181175758c3295fbd70ae6d81d6c65595))

### [0.3.12](https://github.com/GetStream/stream-video-js/compare/client0.3.11...client0.3.12) (2023-08-31)

### Bug Fixes

- do not do any codec preferences when sending dummy
  sdp ([#1028](https://github.com/GetStream/stream-video-js/issues/1028)) ([3910619](https://github.com/GetStream/stream-video-js/commit/391061902ab71571e2910a0ebdfeb02e8bfd390a))

### [0.3.11](https://github.com/GetStream/stream-video-js/compare/client0.3.10...client0.3.11) (2023-08-30)

### Bug Fixes

- **react-native:** blank stream on
  join ([#1022](https://github.com/GetStream/stream-video-js/issues/1022)) ([d5a48f6](https://github.com/GetStream/stream-video-js/commit/d5a48f6e75bf4e1b5c0745b7f0b001fd0ac4b183))

### [0.3.10](https://github.com/GetStream/stream-video-js/compare/client0.3.9...client0.3.10) (2023-08-30)

### Features

- **Call:** Dynascale support for Plain-JS
  SDK ([#914](https://github.com/GetStream/stream-video-js/issues/914)) ([d295fd3](https://github.com/GetStream/stream-video-js/commit/d295fd341bbe325310fc6479f24ef647b013429b))

### [0.3.9](https://github.com/GetStream/stream-video-js/compare/client0.3.8...client0.3.9) (2023-08-29)

### Bug Fixes

- round non-int video dimension
  values ([#1007](https://github.com/GetStream/stream-video-js/issues/1007)) ([baec0b5](https://github.com/GetStream/stream-video-js/commit/baec0b5d4d2242e71c413e93b73897589e31429c))

### [0.3.8](https://github.com/GetStream/stream-video-js/compare/client0.3.7...client0.3.8) (2023-08-29)

### Bug Fixes

- type definition of user object for ws
  auth ([#1003](https://github.com/GetStream/stream-video-js/issues/1003)) ([e0ed3d1](https://github.com/GetStream/stream-video-js/commit/e0ed3d17214e9a300d84c85a0e168ad4a7d16239))

### [0.3.7](https://github.com/GetStream/stream-video-js/compare/client0.3.6...client0.3.7) (2023-08-24)

### Features

- apply target resolution to video feed, sync camera/mic
  init ([#977](https://github.com/GetStream/stream-video-js/issues/977)) ([8ee6488](https://github.com/GetStream/stream-video-js/commit/8ee64882ebd4911445242beef5fd3148372283e3))

### [0.3.6](https://github.com/GetStream/stream-video-js/compare/client0.3.5...client0.3.6) (2023-08-23)

### Bug Fixes

- device api small
  fixes ([#970](https://github.com/GetStream/stream-video-js/issues/970)) ([15b09fd](https://github.com/GetStream/stream-video-js/commit/15b09fd5e1d25046f8e2cbaa951f551631a91779))

### [0.3.5](https://github.com/GetStream/stream-video-js/compare/client0.3.4...client0.3.5) (2023-08-22)

### Bug Fixes

- Change the backtage default value to
  true ([#969](https://github.com/GetStream/stream-video-js/issues/969)) ([5aff8b4](https://github.com/GetStream/stream-video-js/commit/5aff8b4695373de660d625a4945e300d1ff90610))

### [0.3.4](https://github.com/GetStream/stream-video-js/compare/client0.3.3...client0.3.4) (2023-08-21)

### Bug Fixes

- guest auth didn't wait for some API
  calls ([#965](https://github.com/GetStream/stream-video-js/issues/965)) ([5d9e1c6](https://github.com/GetStream/stream-video-js/commit/5d9e1c6ebb09901a8f3e12c435736e0640af62dc))

### [0.3.3](https://github.com/GetStream/stream-video-js/compare/client0.3.2...client0.3.3) (2023-08-18)

### Features

- Disable doesn't stop audio
  tracks ([#950](https://github.com/GetStream/stream-video-js/issues/950)) ([c348f34](https://github.com/GetStream/stream-video-js/commit/c348f34818f0e123e70b9471637ddd64411ebc08))

### [0.3.2](https://github.com/GetStream/stream-video-js/compare/client0.3.1...client0.3.2) (2023-08-16)

### Features

- use new device API in RN SDK and move to
  @stream-io/react-native-webrtc ([#925](https://github.com/GetStream/stream-video-js/issues/925)) ([8442d82](https://github.com/GetStream/stream-video-js/commit/8442d821a8eb97cb4be6e6d71b64337c04a86a15))

### Bug Fixes

- **client:** export missing
  classes ([#943](https://github.com/GetStream/stream-video-js/issues/943)) ([2964eb1](https://github.com/GetStream/stream-video-js/commit/2964eb16c405b7b7020ef9bfda81183f28e40b6b))

### [0.3.1](https://github.com/GetStream/stream-video-js/compare/client0.3.0...client0.3.1) (2023-08-16)

### Features

- New device API
  v1 ([#908](https://github.com/GetStream/stream-video-js/issues/908)) ([82ec41d](https://github.com/GetStream/stream-video-js/commit/82ec41da16bd9d1aa8d51e6eb9a16ce3f70e549b))

## [0.3.0](https://github.com/GetStream/stream-video-js/compare/client0.2.3...client0.3.0) (2023-08-16)

### ⚠ BREAKING CHANGES

- Call State reorganization (#931)

### Features

- Call State
  reorganization ([#931](https://github.com/GetStream/stream-video-js/issues/931)) ([441dbd4](https://github.com/GetStream/stream-video-js/commit/441dbd4ffb8c851abb0ca719be143a1e80d1418c)),
  closes [#917](https://github.com/GetStream/stream-video-js/issues/917)

### [0.2.3](https://github.com/GetStream/stream-video-js/compare/client0.2.2...client0.2.3) (2023-08-14)

### Features

- extra config params in goLive()
  API ([#924](https://github.com/GetStream/stream-video-js/issues/924)) ([e14a082](https://github.com/GetStream/stream-video-js/commit/e14a0829460a3c5ff6d249dd159e6118df0b8352))

### [0.2.2](https://github.com/GetStream/stream-video-js/compare/client0.2.1...client0.2.2) (2023-08-08)

### Features

- **livestream:** Livestream tutorial
  rewrite ([#909](https://github.com/GetStream/stream-video-js/issues/909)) ([49efdaa](https://github.com/GetStream/stream-video-js/commit/49efdaa14faccaa4848e8f9bdf3abb7748b925ac))

### [0.2.1](https://github.com/GetStream/stream-video-js/compare/client0.2.0...client0.2.1) (2023-08-07)

### Features

- enhanced call
  session ([#900](https://github.com/GetStream/stream-video-js/issues/900)) ([dd4f1ea](https://github.com/GetStream/stream-video-js/commit/dd4f1ea03dbab0661a8b79dd55f51b0e9477ae75))

## [0.2.0](https://github.com/GetStream/stream-video-js/compare/client0.1.11...client0.2.0) (2023-08-07)

### ⚠ BREAKING CHANGES

- Server-side participant pinning (#881)

### Features

- Server-side participant
  pinning ([#881](https://github.com/GetStream/stream-video-js/issues/881)) ([72829f1](https://github.com/GetStream/stream-video-js/commit/72829f1caf5b9c719d063a7e5175b7aa7431cd71))

### [0.1.11](https://github.com/GetStream/stream-video-js/compare/client0.1.10...client0.1.11) (2023-08-04)

### Bug Fixes

- update subscriptions when restoring
  connection ([#898](https://github.com/GetStream/stream-video-js/issues/898)) ([55e78c7](https://github.com/GetStream/stream-video-js/commit/55e78c77df5dfa22a4068ad40eb5aeb8a6a9fa8a))

### [0.1.10](https://github.com/GetStream/stream-video-js/compare/client0.1.9...client0.1.10) (2023-08-01)

### Features

- **client:** Create state shortcut for client state
  store ([#888](https://github.com/GetStream/stream-video-js/issues/888)) ([799c90d](https://github.com/GetStream/stream-video-js/commit/799c90d7a22fc90b497493764916e3f620a1481b))

### [0.1.9](https://github.com/GetStream/stream-video-js/compare/client0.1.8...client0.1.9) (2023-07-28)

### Bug Fixes

- set initial device state regardless of call
  state ([#869](https://github.com/GetStream/stream-video-js/issues/869)) ([3c3cb29](https://github.com/GetStream/stream-video-js/commit/3c3cb29e5585e30b0eacc4b0ecb7bab2e075c111))

### [0.1.8](https://github.com/GetStream/stream-video-js/compare/client0.1.7...client0.1.8) (2023-07-27)

### Features

- Add
  call.create ([#862](https://github.com/GetStream/stream-video-js/issues/862)) ([6d07d0b](https://github.com/GetStream/stream-video-js/commit/6d07d0b5248b6339b4ee95af90dba4c4e1f5c5db))

### [0.1.7](https://github.com/GetStream/stream-video-js/compare/client0.1.6...client0.1.7) (2023-07-26)

### Features

- support goLive({ notify:
  true }) ([#848](https://github.com/GetStream/stream-video-js/issues/848)) ([ed67b28](https://github.com/GetStream/stream-video-js/commit/ed67b280082e91e356ee7c0063f2dafab6f8e0c2))

### [0.1.6](https://github.com/GetStream/stream-video-js/compare/client0.1.5...client0.1.6) (2023-07-26)

### Documentation

- Readme for js client, contributing
  guide ([#858](https://github.com/GetStream/stream-video-js/issues/858)) ([4d25c90](https://github.com/GetStream/stream-video-js/commit/4d25c909d2db3c5f98f89ad37dd810fc4ab7cc95))

### [0.1.5](https://github.com/GetStream/stream-video-js/compare/client0.1.4...client0.1.5) (2023-07-21)

### Bug Fixes

- strict mode
  issue ([#740](https://github.com/GetStream/stream-video-js/issues/740)) ([c39e4e4](https://github.com/GetStream/stream-video-js/commit/c39e4e4041a2326393478ad808b2aa791d50f8ce))

### [0.1.4](https://github.com/GetStream/stream-video-js/compare/client0.1.3...client0.1.4) (2023-07-21)

### Features

- ICE
  Restarts ([#814](https://github.com/GetStream/stream-video-js/issues/814)) ([a03f8cd](https://github.com/GetStream/stream-video-js/commit/a03f8cd8cc90f91fb67c4c80e097eed64ca67715))

### Bug Fixes

- shorter thresholds for ICE
  restarts ([#839](https://github.com/GetStream/stream-video-js/issues/839)) ([fe2bbe5](https://github.com/GetStream/stream-video-js/commit/fe2bbe5687a26e01983273d8c25016689c6f1584)),
  closes [#814](https://github.com/GetStream/stream-video-js/issues/814)

### [0.1.3](https://github.com/GetStream/stream-video-js/compare/client0.1.2...client0.1.3) (2023-07-20)

### Bug Fixes

- server side user connect + add
  tests ([#825](https://github.com/GetStream/stream-video-js/issues/825)) ([95ea24d](https://github.com/GetStream/stream-video-js/commit/95ea24d03306d1b25c3c5af042a202a7b551d865))

### [0.1.2](https://github.com/GetStream/stream-video-js/compare/client0.1.1...client0.1.2) (2023-07-19)

### Features

- server-side
  client ([#815](https://github.com/GetStream/stream-video-js/issues/815)) ([c3bc445](https://github.com/GetStream/stream-video-js/commit/c3bc445c7db68965934c3e72f005ff7e949e9328))

### [0.1.1](https://github.com/GetStream/stream-video-js/compare/client0.1.0...client0.1.1) (2023-07-18)

### Features

- **sessions:** update to the new call.session event
  models ([#806](https://github.com/GetStream/stream-video-js/issues/806)) ([2966837](https://github.com/GetStream/stream-video-js/commit/296683789823a8dd12e99193f6baaf971824ae83))

## [0.1.0](https://github.com/GetStream/stream-video-js/compare/client0.0.51...client0.1.0) (2023-07-17)

### ⚠ BREAKING CHANGES

- Trigger breaking change for client

### Features

- Trigger breaking change for
  client ([5230bfb](https://github.com/GetStream/stream-video-js/commit/5230bfb5cea4776f78fd9ae73cdeb5a0ea27c7fd))

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
