output.call_id = (Math.random() + 1).toString(36).substring(7);
output.pages = {
  login: {
    sara: 'Sara.*',
  },
  callDetails: {
    callIdInputField: 'Type your call ID here...',
    startCallButton: 'Create meeting with callID.*',
  },
  lobby: {
    joinButton: 'Join',
  },
  activeCall: {},
};
output.assertions = {
  activeCall: {
    participantsCountIs1: '1',
    participantsCountIs6: '6',
  },
};
