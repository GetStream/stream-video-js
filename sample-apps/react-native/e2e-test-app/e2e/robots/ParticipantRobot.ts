import { Robot } from './Robot';

/**
 * Android: `robots/ParticipantRobot.kt`. Drives stream-video-buddy, which joins the call from a
 * (headless) browser through https://getstream.io/video/demos. The buddy server runs on the host
 * (`fastlane start_video_buddy` in the dogfood app), like this suite, so it is always `localhost`.
 *
 *   await participantRobot.setUserCount(2).joinCall(callId);
 */
export class ParticipantRobot extends Robot {
  static readonly videoBuddyUrl = `http://localhost:${process.env.VIDEO_BUDDY_PORT ?? 5678}`;

  private readonly testName: string;
  private readonly headless: boolean;
  private readonly record: boolean;
  private readonly logs: boolean;
  private screenSharingDuration?: number;
  private callRecordingDuration?: number;
  private userCount = 1;
  private callDuration = 30;

  constructor(
    testName: string,
    { headless = true, record = true, logs = true } = {},
  ) {
    super();
    this.testName = testName;
    this.headless = headless;
    this.record = record;
    this.logs = logs;
  }

  setScreenSharingDuration(duration: number): this {
    return this.perform(async () => {
      this.screenSharingDuration = duration;
    });
  }

  setCallRecordingDuration(duration: number): this {
    return this.perform(async () => {
      this.callRecordingDuration = duration;
    });
  }

  setCallDuration(duration: number): this {
    return this.perform(async () => {
      this.callDuration = duration;
    });
  }

  setUserCount(count: number): this {
    return this.perform(async () => {
      this.userCount = count;
    });
  }

  joinCall(
    callId: string,
    { options = [], actions = [], async = true }: JoinCallOptions = {},
  ): this {
    return this.perform(() => {
      const params: Record<string, unknown> = {
        [Config.TEST_NAME]: this.testName,
        [Config.CALL_ID]: callId,
        [Config.USER_COUNT]: this.userCount,
        [Config.CALL_DURATION]: this.callDuration,
        ...this.debugParams(),
      };
      for (const flag of [...options, ...actions]) {
        params[flag] = true;
      }
      if (this.callRecordingDuration !== undefined) {
        params[Config.CALL_RECORDING_DURATION] = this.callRecordingDuration;
      }
      if (this.screenSharingDuration !== undefined) {
        params[Config.SCREEN_SHARING_DURATION] = this.screenSharingDuration;
      }
      return this.postRequest(`join?async=${async}`, params);
    });
  }

  ringUser(userId: string, { audioOnly = false, async = true } = {}): this {
    return this.perform(() =>
      this.postRequest(`ring?async=${async}`, {
        'audio-call': audioOnly,
        [Config.TEST_NAME]: this.testName,
        [Config.USER_ID]: userId,
        [Config.CALL_DURATION]: this.callDuration,
        ...this.debugParams(),
      }),
    );
  }

  private debugParams = () => ({
    [DebugActions.SHOW_WINDOW]: !this.headless,
    [DebugActions.PRINT_CONSOLE_LOGS]: this.logs,
    [DebugActions.RECORD_SESSION]: this.record,
  });

  private postRequest = async (
    path: string,
    params: Record<string, unknown>,
  ) => {
    const url = `${ParticipantRobot.videoBuddyUrl}/${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch (error) {
      throw new Error(
        `stream-video-buddy is not reachable at ${url} (run \`bundle exec fastlane start_video_buddy\`): ${String(error)}`,
      );
    }
    if (!response.ok) {
      throw new Error(
        `stream-video-buddy ${path} failed: ${response.status} ${await response.text()}`,
      );
    }
  };
}

export enum Options {
  WITH_CAMERA = 'camera',
  WITH_MICROPHONE = 'mic',
  BE_SILENT = 'silent',
}

export enum Actions {
  SHARE_SCREEN = 'screen-share',
  RECORD_CALL = 'record',
}

enum DebugActions {
  SHOW_WINDOW = 'show-window',
  RECORD_SESSION = 'record-session',
  PRINT_CONSOLE_LOGS = 'verbose',
}

enum Config {
  TEST_NAME = 'test-name',
  CALL_ID = 'call-id',
  USER_ID = 'user-id',
  USER_COUNT = 'user-count',
  CALL_DURATION = 'duration',
  SCREEN_SHARING_DURATION = 'screen-sharing-duration',
  CALL_RECORDING_DURATION = 'recording-duration',
}

type JoinCallOptions = {
  options?: Options[];
  actions?: Actions[];
  async?: boolean;
};
