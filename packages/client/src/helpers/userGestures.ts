/**
 * The DOM events treated as a user gesture: any of them lets the page start
 * blocked media or resume a suspended audio context.
 */
export const USER_GESTURE_EVENTS = ['click', 'touchend', 'keydown'] as const;
