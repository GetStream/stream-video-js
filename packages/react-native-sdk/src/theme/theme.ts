import {
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native/types';
import { colors } from './colors';
import {
  type ColorScheme,
  type DimensionType,
  type FontStyle,
  type FontTypes,
  type Insets,
} from './types';
import { type ColorValue } from 'react-native';

export type Theme = {
  variants: {
    buttonSizes: DimensionType;
    roundButtonSizes: DimensionType;
    iconSizes: DimensionType;
    avatarSizes: DimensionType;
    fontSizes: DimensionType;
    spacingSizes: DimensionType;
    borderRadiusSizes: DimensionType;
    insets: Insets;
  };
  typefaces: Record<FontTypes, FontStyle>;
  defaults: {
    color: ColorValue;
    backgroundColor: ColorValue;
    margin: number;
    padding: number;
    fontSize: number;
    iconSize: number;
    fontWeight: TextStyle['fontWeight'];
    borderRadius: ViewStyle['borderRadius'];
    borderColor: ColorValue;
    borderWidth: ViewStyle['borderWidth'];
  };
  colors: ColorScheme;
  avatar: {
    container: ViewStyle;
    image: ImageStyle;
    text: TextStyle;
  };
  callContent: {
    container: ViewStyle;
    callParticipantsContainer: ViewStyle;
    topContainer: ViewStyle;
  };
  callControls: {
    container: ViewStyle;
  };
  callControlsButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  acceptCallButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  hangupCallButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  rejectCallButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  screenShareToggleButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  toggleAudioPreviewButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  toggleAudioPublishingButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  toggleCameraFaceButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  toggleVideoPreviewButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  toggleVideoPublishingButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  joinCallButton: {
    container: ViewStyle;
    label: TextStyle;
  };
  floatingParticipantsView: {
    container: ViewStyle;
    participantViewContainer: ViewStyle;
    videoFallback: ViewStyle;
  };
  chatButton: {
    container: ViewStyle;
    svgContainer: ViewStyle;
  };
  callParticipantsGrid: {
    container: ViewStyle;
  };
  callParticipantsSpotlight: {
    container: ViewStyle;
    fullScreenSpotlightContainer: ViewStyle;
    callParticipantsListContainer: ViewStyle;
    spotlightContainer: ViewStyle;
  };
  lobby: {
    container: ViewStyle;
    topContainer: ViewStyle;
    heading: TextStyle;
    subHeading: TextStyle;
    videoContainer: ViewStyle;
    bottomContainer: ViewStyle;
    infoContainer: ViewStyle;
    infoText: TextStyle;
    participantStatusContainer: ViewStyle;
    avatarContainer: ViewStyle;
    userNameLabel: TextStyle;
    audioMutedIconContainer: ViewStyle;
  };
  participantLabel: {
    container: ViewStyle;
    userNameLabel: TextStyle;
    audioMutedIconContainer: ViewStyle;
    videoMutedIconContainer: ViewStyle;
    pinIconContainer: ViewStyle;
    screenShareIconContainer: ViewStyle;
  };
  participantNetworkQualityIndicator: {
    container: ViewStyle;
  };
  participantReaction: {
    container: ViewStyle;
    reaction: ViewStyle;
  };
  participantVideoFallback: {
    container: ViewStyle;
    label: TextStyle;
    avatarContainer: ViewStyle;
    avatarText: TextStyle;
    avatarImage: ImageStyle;
  };
  participantView: {
    container: ViewStyle;
    footerContainer: ViewStyle;
    highlightedContainer: ViewStyle;
  };
  videoRenderer: {
    container: ViewStyle;
    videoStream: ViewStyle;
  };
  ringingCallContent: {
    container: ViewStyle;
  };
  incomingCall: {
    background: ViewStyle;
    content: ViewStyle;
    topContainer: ViewStyle;
    incomingCallText: TextStyle;
    incomingCallControls: ViewStyle;
    bottomContainer: ViewStyle;
    buttonGroup: ViewStyle;
  };
  outgoingCall: {
    container: ViewStyle;
    background: ViewStyle;
    content: ViewStyle;
    topContainer: ViewStyle;
    callingText: TextStyle;
    outgoingCallControls: ViewStyle;
    bottomContainer: ViewStyle;
    buttonGroup: ViewStyle;
    deviceControlButtons: ViewStyle;
  };
  userInfo: {
    container: ViewStyle;
    avatarGroup: ViewStyle;
    name: TextStyle;
  };
  reactionsPicker: {
    reactionsPopup: ViewStyle;
    reactionsButtonDimmer: ViewStyle;
    reactionItem: ViewStyle;
    reactionText: TextStyle;
  };
  lobbyControls: {
    container: ViewStyle;
  };
  participantInfoBadge: {
    container: ViewStyle;
    participantCountContainer: ViewStyle;
    participantsIconContainer: ViewStyle;
    participantsCountText: TextStyle;
  };
  hostLivestream: {
    container: ViewStyle;
  };
  viewerLivestream: {
    container: ViewStyle;
  };
  livestreamLayout: {
    container: ViewStyle;
  };
  hostLivestreamTopView: {
    container: ViewStyle;
    leftElement: ViewStyle;
    centerElement: ViewStyle;
    rightElement: ViewStyle;
    liveInfo: ViewStyle;
  };
  viewerLivestreamTopView: {
    container: ViewStyle;
    leftElement: ViewStyle;
    centerElement: ViewStyle;
    rightElement: ViewStyle;
    liveInfo: ViewStyle;
  };
  followerCount: {
    container: ViewStyle;
    icon: ViewStyle;
    label: TextStyle;
  };
  durationBadge: {
    container: ViewStyle;
    icon: ViewStyle;
    label: TextStyle;
  };
  liveIndicator: {
    container: ViewStyle;
    label: TextStyle;
  };
  hostLivestreamControls: {
    container: ViewStyle;
    leftElement: ViewStyle;
    rightElement: ViewStyle;
  };
  viewerLivestreamControls: {
    container: ViewStyle;
    leftElement: ViewStyle;
    rightElement: ViewStyle;
  };
  hostStartStreamButton: {
    container: ViewStyle;
    icon: ViewStyle;
    text: TextStyle;
  };
  viewerLeaveStreamButton: {
    container: ViewStyle;
    icon: ViewStyle;
    text: TextStyle;
  };
  livestreamMediaControls: {
    container: ViewStyle;
  };
  livestreamAudioControlButton: {
    container: ViewStyle;
    icon: ViewStyle;
  };
  livestreamVideoControlButton: {
    container: ViewStyle;
    icon: ViewStyle;
  };
  livestreamScreenShareToggleButton: {
    container: ViewStyle;
    icon: ViewStyle;
  };
  screenshareOverlay: {
    container: ViewStyle;
    text: TextStyle;
    button: ViewStyle;
    buttonIcon: ViewStyle;
    buttonText: TextStyle;
  };

  // Index signature for additional dynamic properties
  [component: string]: any;
};

export const defaultTheme: Theme = {
  variants: {
    roundButtonSizes: {
      xs: 16,
      sm: 24,
      md: 36,
      lg: 44,
      xl: 56,
    },
    borderRadiusSizes: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    buttonSizes: {
      xs: 40,
      sm: 50,
      md: 60,
      lg: 70,
      xl: 80,
    },
    iconSizes: {
      xs: 15,
      sm: 20,
      md: 25,
      lg: 30,
      xl: 35,
    },
    avatarSizes: {
      xs: 50,
      sm: 90,
      md: 100,
      lg: 160,
      xl: 180,
    },
    spacingSizes: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    fontSizes: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    },
    insets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  },
  typefaces: {
    heading4: {
      fontSize: 34,
      fontWeight: '400',
    },
    heading5: {
      fontSize: 24,
      fontWeight: '400',
    },
    heading6: {
      fontSize: 20,
      fontWeight: '500',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400',
    },
    subtitleBold: {
      fontSize: 16,
      fontWeight: '500',
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600',
    },
    caption: {
      fontSize: 10,
      fontWeight: '400',
    },
  },
  defaults: {
    color: colors.primary,
    backgroundColor: colors.sheetPrimary,
    margin: 10,
    padding: 10,
    fontSize: 16,
    fontWeight: '500',
    borderRadius: 32,
    iconSize: 28,
    borderColor: colors.buttonPrimary,
    borderWidth: 1,
  },
  colors: colors,
  avatar: {
    container: {},
    image: {},
    text: {},
  },
  acceptCallButton: {
    container: {},
    svgContainer: {},
  },
  callContent: {
    container: {},
    callParticipantsContainer: {},
    topContainer: {},
  },
  callControls: {
    container: {},
  },
  callControlsButton: {
    container: {},
    svgContainer: {},
  },
  joinCallButton: {
    container: {},
    label: {},
  },
  chatButton: {
    container: {},
    svgContainer: {},
  },
  hangupCallButton: {
    container: {},
    svgContainer: {},
  },
  rejectCallButton: {
    container: {},
    svgContainer: {},
  },
  screenShareToggleButton: {
    container: {},
    svgContainer: {},
  },
  toggleAudioPreviewButton: {
    container: {},
    svgContainer: {},
  },
  toggleAudioPublishingButton: {
    container: {},
    svgContainer: {},
  },
  toggleCameraFaceButton: {
    container: {},
    svgContainer: {},
  },
  toggleVideoPreviewButton: {
    container: {},
    svgContainer: {},
  },
  toggleVideoPublishingButton: {
    container: {},
    svgContainer: {},
  },
  callParticipantsGrid: {
    container: {},
  },
  callParticipantsSpotlight: {
    container: {},
    fullScreenSpotlightContainer: {},
    callParticipantsListContainer: {},
    spotlightContainer: {},
  },
  lobby: {
    container: {},
    topContainer: {},
    heading: {},
    subHeading: {},
    bottomContainer: {},
    videoContainer: {},
    infoContainer: {},
    infoText: {},
    participantStatusContainer: {},
    avatarContainer: {},
    userNameLabel: {},
    audioMutedIconContainer: {},
  },
  floatingParticipantsView: {
    container: {},
    participantViewContainer: {},
    videoFallback: {},
  },
  participantLabel: {
    container: {},
    userNameLabel: {},
    audioMutedIconContainer: {},
    videoMutedIconContainer: {},
    pinIconContainer: {},
    screenShareIconContainer: {},
  },
  participantNetworkQualityIndicator: {
    container: {},
  },
  participantReaction: {
    container: {},
    reaction: {},
  },
  participantVideoFallback: {
    container: {},
    label: {},
    avatarContainer: {},
    avatarText: {},
    avatarImage: {},
  },
  participantView: {
    container: {},
    footerContainer: {},
    highlightedContainer: {},
  },
  reactionsPicker: {
    reactionsPopup: {},
    reactionsButtonDimmer: {},
    reactionItem: {},
    reactionText: {},
  },
  videoRenderer: {
    container: {},
    videoStream: {},
  },
  incomingCall: {
    background: {},
    content: {},
    topContainer: {},
    incomingCallText: {},
    incomingCallControls: {},
    bottomContainer: {},
    buttonGroup: {},
  },
  outgoingCall: {
    container: {},
    background: {},
    content: {},
    topContainer: {},
    callingText: {},
    outgoingCallControls: {},
    bottomContainer: {},
    buttonGroup: {},
    deviceControlButtons: {},
  },
  ringingCallContent: { container: {} },
  userInfo: {
    container: {},
    avatarGroup: {},
    name: {},
  },
  lobbyControls: {
    container: {},
  },
  participantInfoBadge: {
    container: {},
    participantCountContainer: {},
    participantsIconContainer: {},
    participantsCountText: {},
  },
  hostLivestream: {
    container: {},
  },
  hostLivestreamTopView: {
    container: {},
    leftElement: {},
    rightElement: {},
    centerElement: {},
    liveInfo: {},
  },
  viewerLivestream: {
    container: {},
  },
  livestreamLayout: {
    container: {},
  },
  viewerLivestreamTopView: {
    container: {},
    leftElement: {},
    centerElement: {},
    rightElement: {},
    liveInfo: {},
  },
  followerCount: {
    container: {},
    icon: {},
    label: {},
  },
  durationBadge: {
    container: {},
    icon: {},
    label: {},
  },
  liveIndicator: {
    container: {},
    label: {},
  },
  hostLivestreamControls: {
    container: {},
    leftElement: {},
    rightElement: {},
  },
  viewerLivestreamControls: {
    container: {},
    leftElement: {},
    rightElement: {},
  },
  hostStartStreamButton: {
    container: {},
    icon: {},
    text: {},
  },
  viewerLeaveStreamButton: {
    container: {},
    icon: {},
    text: {},
  },
  livestreamMediaControls: {
    container: {},
  },
  livestreamAudioControlButton: {
    container: {},
    icon: {},
  },
  livestreamVideoControlButton: {
    container: {},
    icon: {},
  },
  livestreamScreenShareToggleButton: {
    container: {},
    icon: {},
  },
  screenshareOverlay: {
    container: {},
    text: {},
    button: {},
    buttonIcon: {},
    buttonText: {},
  },
};
