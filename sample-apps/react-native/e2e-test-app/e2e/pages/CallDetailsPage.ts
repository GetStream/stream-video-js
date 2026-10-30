/** Android: `pages/CallDetailsPage.kt`. */
export const CallDetailsPage = {
  get userName() {
    return by.id('user-name');
  },
  get callIdInputField() {
    return by.id('call-id-input-field');
  },
  get joinCallButton() {
    return by.id('join-call-button');
  },
  get wheelIcon() {
    return by.id('settings-icon');
  },
  get signOutButton() {
    return by.id('sign-out-button');
  },
};
