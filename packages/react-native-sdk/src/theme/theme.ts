import { ImageStyle, TextStyle, ViewStyle } from 'react-native/types';
import { colors } from './colors';
import { ColorScheme, DimensionType, FontStyle, FontTypes } from './types';
import { ColorValue } from 'react-native';

export type Theme = {
  variants: {
    buttonSizes: DimensionType;
    iconSizes: DimensionType;
    avatarSizes: DimensionType;
    fontSizes: DimensionType;
    spacingSizes: DimensionType;
  };
  typefaces: Record<FontTypes, FontStyle>;
  defaults: {
    color: ColorValue;
    backgroundColor: ColorValue;
    margin: number;
    padding: number;
    fontSize: number;
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
    highligtedContainer: ViewStyle;
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
  callTopView: {
    container: ViewStyle;
    content: ViewStyle;
    backIconContainer: ViewStyle;
    leftElement: ViewStyle;
    centerElement: ViewStyle;
    rightElement: ViewStyle;
    title: TextStyle;
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

  /**
   * Gets a value from the theme object.
   *
   * @param {string} componentOrPath - Component name or a dot-separated path.
   * @param {keyof Theme['defaults'] | string} [prop] - Property name.
   * @return {string | number | ColorValue | undefined} - Value of the given key or undefined.
   * @logs {Error} - When the path is invalid.
   */
  get: (
    componentOrPath: string,
    prop?: keyof Theme['defaults'] | string
  ) => Theme | string | number | ColorValue | undefined;

  // Index signature for additional dynamic properties
  [component: string]: any;
};

export const defaultTheme: Theme = {
  variants: {
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
    backgroundColor: colors.background2,
    margin: 10,
    padding: 10,
    fontSize: 16,
    fontWeight: '500',
    borderRadius: 10,
    borderColor: colors.primary,
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
    highligtedContainer: {},
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
  callTopView: {
    container: {},
    content: {},
    backIconContainer: {},
    leftElement: {},
    centerElement: {},
    rightElement: {},
    title: {},
  },
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

  get: function (
    componentOrPath: string,
    prop?: keyof Theme['defaults'] | string
  ): string | number | ColorValue | undefined {
    // dot-separated path
    if (componentOrPath.includes('.')) {
      const path = componentOrPath.split('.');
      let value = undefined;

      for (const key of path) {
        if (value ? value[key] !== undefined : this[key] !== undefined) {
          value = value ? value[key] : this[key];
        } else {
          console.error(`Invalid path: ${componentOrPath}`);
          return undefined;
        }
      }

      return value;
    }

    // component and prop-based query
    if (prop && this[componentOrPath] && this[componentOrPath][prop]) {
      return this[componentOrPath][prop];
    }

    const defaultValue = this.defaults[prop as keyof Theme['defaults']];
    if (!defaultValue) {
      console.error(`Invalid component or prop: ${componentOrPath}.${prop}`);
      return undefined;
    }

    return defaultValue;
  },
};
