/**
 * The dogfood app's meeting screen (`src/screens/Meeting/JoinMeetingScreen.tsx`) and its header
 * (`src/components/NavigationHeader.tsx`), testIDs from `src/constants/TestIds.ts`.
 */
export const CallDetailsPage = {
  get callIdInputField() {
    return by.id('call-id-input');
  },
  get joinCallButton() {
    return by.id('join-meeting-button');
  },
  get startNewCallButton() {
    return by.id('start-new-call-button');
  },
  get logOutButton() {
    return by.id('log-out');
  },
  /** The sign-out confirmation is a native alert, so it has no testID. */
  get logOutConfirmButton() {
    return by.text('OK');
  },
};
