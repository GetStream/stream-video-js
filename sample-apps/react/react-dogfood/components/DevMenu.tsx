import { Icon, useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

export const DevMenu = () => {
  return (
    <ul className="rd__dev-menu">
      <li className="rd__dev-menu__item">
        <RestartPublisher />
      </li>
      <li className="rd__dev-menu__item">
        <RestartSubscriber />
      </li>

      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />

      <li className="rd__dev-menu__item">
        <ConnectToLocalSfu sfuId="SFU-1" port={3031} />
      </li>
      <li className="rd__dev-menu__item">
        <ConnectToLocalSfu sfuId="SFU-2" port={3033} />
      </li>
      <li className="rd__dev-menu__item">
        <ConnectToLocalSfu sfuId="SFU-3" port={3036} />
      </li>

      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />

      <li className="rd__dev-menu__item">
        <LogPublisherStats />
      </li>
      <li className="rd__dev-menu__item">
        <LogSubscriberStats />
      </li>
      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />

      <li className="rd__dev-menu__item">
        <StartStopBroadcasting />
      </li>
      <li className="rd__dev-menu__item">
        <GoOrStopLive />
      </li>
      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />
      <li className="rd__dev-menu__item">
        <a
          className="rd__link rd__link--faux-button rd__link--align-left"
          href="https://www.notion.so/stream-wiki/Usage-guide-and-known-limitations-603b12af2dff43d69119be4dae462b19"
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="rd__link__icon" icon="info-document" />
          Usage guide
        </a>
      </li>
      <li className="rd__dev-menu__item">
        <a
          className="rd__link rd__link--faux-button rd__link--align-left"
          href="https://www.notion.so/stream-wiki/Usage-guide-and-known-limitations-603b12af2dff43d69119be4dae462b19"
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="rd__link__icon" icon="film-roll" />
          Recordings
        </a>
      </li>
    </ul>
  );
};

const StartStopBroadcasting = () => {
  const call = useCall();
  const { useIsCallHLSBroadcastingInProgress } = useCallStateHooks();
  const isBroadcasting = useIsCallHLSBroadcastingInProgress();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        if (isBroadcasting) {
          call.stopHLS().catch((err) => {
            console.error(`Failed to start broadcasting`, err);
          });
        } else {
          call
            .startHLS()
            .then((res) => {
              console.log(`Broadcasting started: ${res.playlist_url}`);
            })
            .catch((err) => {
              console.error(`Failed to stop broadcasting`, err);
            });
        }
      }}
    >
      <Icon
        className="rd__button__icon"
        icon={isBroadcasting ? 'recording-off' : 'recording-on'}
      />
      {isBroadcasting ? 'Stop broadcasting' : 'Start broadcasting'}
    </button>
  );
};

const GoOrStopLive = () => {
  const call = useCall();
  const { useIsCallLive } = useCallStateHooks();
  const isLive = useIsCallLive();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        if (isLive) {
          call.stopLive().catch((err) => {
            console.error(`Failed to stop live`, err);
          });
        } else {
          call
            .goLive()
            .then((res) => {
              console.log(`Live started: ${res}`);
            })
            .catch((err) => {
              console.error(`Failed to start live`, err);
            });
        }
      }}
    >
      <Icon
        className="rd__button__icon"
        icon={isLive ? 'recording-off' : 'recording-on'}
      />
      {isLive ? 'Stop Live' : 'Go Live'}
    </button>
  );
};

// const MigrateToNewSfu = () => {
//   const call = useCall();
//   return (
//     <button className="rd__button rd__button--align-left"
//       hidden
//       onClick={() => {
//         if (!call) return;
//         call['dispatcher'].dispatch({
//           eventPayload: {
//             oneofKind: 'goAway',
//             goAway: {
//               reason: SfuModels.GoAwayReason.REBALANCE,
//             },
//           },
//         });
//       }}
//     >
//       <ListItemIcon>
//         <SwitchAccessShortcutIcon
//           fontSize="small"
//           sx={{
//             transform: 'rotate(90deg)',
//           }}
//         />
//       </ListItemIcon>
//       <ListItemText>Migrate to a new SFU</ListItemText>
//     </button>
//   );
// };
//

// const EmulateSFUShuttingDown = () => {
//   const call = useCall();
//   return (
//     <button className="rd__button rd__button--align-left"
//       onClick={() => {
//         if (!call) return;
//         call['dispatcher'].dispatch({
//           eventPayload: {
//             oneofKind: 'error',
//             error: {
//               code: SfuModels.ErrorCode.SFU_SHUTTING_DOWN,
//             },
//           },
//         });
//       }}
//     >
//       <ListItemIcon>
//         <PowerSettingsNewIcon fontSize="small" />
//       </ListItemIcon>
//       <ListItemText>Emulate SFU shutdown</ListItemText>
//     </button>
//   );
// };

const ConnectToLocalSfu = (props: { port?: number; sfuId?: string }) => {
  const { port = 3031, sfuId = 'SFU-1' } = props;
  const params = new URLSearchParams(window.location.search);
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        params.set('sfuUrl', `http://127.0.0.1:${port}/twirp`);
        params.set('sfuWsUrl', `ws://127.0.0.1:${port}/ws`);
        window.location.search = params.toString();
      }}
    >
      <Icon className="rd__button__icon" icon="mediation" />
      Connect to local {sfuId}
    </button>
  );
};

const RestartPublisher = () => {
  const call = useCall();
  return (
    <button
      className="rd__button rd__button--align-left"
      hidden={!call}
      onClick={() => {
        if (!call) return;
        call.publisher?.restartIce();
      }}
    >
      <Icon className="rd__button__icon" icon="recording-off" />
      ICERestart Publisher
    </button>
  );
};

const RestartSubscriber = () => {
  const call = useCall();
  return (
    <button
      className="rd__button rd__button--align-left"
      hidden={!call}
      onClick={() => {
        if (!call) return;
        call.subscriber?.restartIce();
      }}
    >
      <Icon className="rd__button__icon" icon="recording-on" />
      ICERestart Subscriber
    </button>
  );
};

const LogPublisherStats = () => {
  const call = useCall();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        call.publisher?.getStats().then((stats: RTCStatsReport) => {
          const arr: any = [];
          stats.forEach((value) => {
            arr.push(value);
          });
          console.log('Publisher stats', arr);
        });
      }}
    >
      <Icon className="rd__button__icon" icon="folder" />
      Log Publisher stats
    </button>
  );
};

const LogSubscriberStats = () => {
  const call = useCall();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        call.subscriber?.getStats().then((stats: RTCStatsReport) => {
          const arr: any = [];
          stats.forEach((value) => {
            arr.push(value);
          });
          console.log('Subscriber stats', arr);
        });
      }}
    >
      <Icon className="rd__button__icon" icon="folder" />
      Log Subscriber stats
    </button>
  );
};
