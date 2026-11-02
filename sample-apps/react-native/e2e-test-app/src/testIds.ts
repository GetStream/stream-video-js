export const TestIds = {
  login: {
    randomUserSignIn: 'random-user-sign-in',
    emailSignIn: 'email-sign-in',
    emailInputField: 'email-input-field',
    loginButton: 'login-button',
  },
  callDetails: {
    userName: 'user-name',
    callIdInputField: 'call-id-input-field',
    joinCallButton: 'join-call-button',
    settingsIcon: 'settings-icon',
    signOutButton: 'sign-out-button',
  },
  lobby: {
    closeButton: 'lobby-close-button',
    participantsCount: (count: number) => `participants-count-${count}`,
  },
  call: {
    participantsCountBadge: 'participants-count-badge',
  },
} as const;
