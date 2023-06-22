output.call_id = (Math.random() + 1).toString(36).substring(7);
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
    logOutAvatar: 'log-out-avatar-button',
    confirmSignOutButton: 'OK',
  },
  lobby: {
    joinButton: 'Join',
  },
  activeCall: {
    participantsInfoButton: 'participants-info-button',
    hangupButton: 'hang-up-call-button',
  },
  participantsInfo: {
    exitButton: 'exit-participants-info-button',
  },
};
output.assertions = {
  participantsInfo: {
    participantsCountIs1: 'Participants (1)',
    participantsCountIs6: 'Participants (6)',
  },
  joinMeeting: {
    signOutModalTitle: 'Sign out as Gerri',
  },
  login: {
    customUserInputField: 'Enter custom user',
  },
};
