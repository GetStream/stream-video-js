import type { VideoEvent } from '../gen/coordinator';

/** Handles a single video event of the given type. */
export type EventHandler<T extends VideoEvent['type']> = (
  event: Extract<VideoEvent, { type: T }>,
) => void;

/**
 * Identity type constrained to real event names, so that a name which no
 * longer exists in `VideoEvent` fails to compile instead of being ignored.
 */
type EventTypes<T extends VideoEvent['type']> = T;

/**
 * Events that intentionally leave the call state untouched. Listing a name
 * here excuses it from `CallStateEventHandlers`, which is what makes a newly
 * introduced event fail to compile until it has been triaged.
 */
type UnhandledEventType = EventTypes<
  | 'call.frame_recording_ready'
  | 'call.kicked_user'
  | 'call.moderation_blur'
  | 'call.moderation_warning'
  | 'call.permission_request'
  | 'call.recording_ready'
  | 'call.rtmp_broadcast_failed'
  | 'call.rtmp_broadcast_started'
  | 'call.rtmp_broadcast_stopped'
  | 'call.stats_report_ready'
  | 'call.transcription_ready'
  | 'call.user_feedback_submitted'
  | 'call.user_muted'
  | 'connection.error'
  | 'connection.ok'
  | 'health.check'
  | 'user.updated'
  | 'custom'
>;

export type AllEventHandlers = {
  [T in VideoEvent['type']]: EventHandler<T>;
};

/** A handler for every event that does update the call state. */
export type CallStateEventHandlers = Omit<AllEventHandlers, UnhandledEventType>;
