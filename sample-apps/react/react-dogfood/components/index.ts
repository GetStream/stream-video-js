export * from './ChatWrapper';
export * from './ChatUI';
export * from './MeetingUI';
export * from './NewMessageNotification';
export * from './UnreadCountBadge';

/**
 * Defaults to `videocall`. Make sure to respect the `channel_type`
 * query parameter if provided.
 */
export const CHANNEL_TYPE = 'videocall';
