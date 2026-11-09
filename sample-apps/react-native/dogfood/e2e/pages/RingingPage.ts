/**
 * The SDK's incoming call screen (`IncomingCall` in `RingingCallContent`), which the dogfood app
 * shows in its Call mode (`src/navigators/Call.tsx`). The screen has no testIDs, so it is selected
 * by its English text.
 */
export const RingingPage = {
  get incomingCallTitle() {
    return by.text('Incoming Call...');
  },
};
