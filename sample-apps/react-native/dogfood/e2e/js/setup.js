output.callId = (Math.random() + 1).toString(36).substring(7);
output.callDuration = 100;
output.pages = {
  chooseFlow: {
    meeting: 'Meeting',
  },
  login: {
    customUserInputField: 'Enter custom user',
    userName: 'Gerri',
    loginButton: 'Login',
  },
  joinMeeting: {
    callIdInputField: 'Type your Call ID',
    startCallButton: 'Join Call',
    chooseFlowButton: 'choose-mode',
    logOutButton: 'log-out',
    confirmSignOutButton: 'OK',
    signOutModalTitle: 'Sign out as.*',
  },
  lobby: {
    joinButton: 'Join',
  },
  activeCall: {
    participantsInfoButton: 'participants-info-button',
    participantsCount: 'participants-count-.*',
    hangupButton: 'hang-up-call',
  },
  participantsInfo: {
    exitButton: 'exit-participants-info',
  },
};
