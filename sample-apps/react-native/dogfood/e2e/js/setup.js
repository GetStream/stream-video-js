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
  },
  lobby: {
    joinButton: 'Join',
  },
  activeCall: {
    participantsInfoButton: 'participants-info',
    hangupButton: 'hang-up-call',
  },
  participantsInfo: {
    exitButton: 'exit-participants-info',
  },
};
output.assertions = {
  participantsInfo: {
    participantsCountIs1: 'Participants (1)',
    participantsCountIs6: 'Participants (6)',
  },
  joinMeeting: {
    signOutModalTitle: 'Sign out as.*',
  },
  login: {
    customUserInputField: 'Enter custom user',
  },
};
