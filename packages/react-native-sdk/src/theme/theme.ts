import { type ColorValue, type TextStyle, type ViewStyle } from 'react-native';
import { type Insets } from './types';
import { tokens } from './tokens';
import { IStreamTokens } from './tokens/StreamTokens.types';
import { DeepPartial } from '../contexts';

export type BaseButtonSizes = 'small' | 'medium' | 'large';
export type BaseButtonVariants =
  'primary' | 'secondary' | 'destructive' | 'disabled';
type ButtonVariantStyle = {
  container: ViewStyle;
  text: TextStyle;
};

type BaseButtonStyle = {
  container: ViewStyle;
  content: ViewStyle;
  accessory: ViewStyle;
} & {
  [key in BaseButtonVariants]: ButtonVariantStyle;
} & {
  [key in BaseButtonSizes]: ViewStyle;
};

export type AvatarSize = '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
type AvatarStyle = {
  container: {
    base: ViewStyle;
  } & { [key in AvatarSize]: ViewStyle };
  text: {
    base: TextStyle;
  } & { [key in AvatarSize]: TextStyle };
};

export type AvatarGroupSize = '3xl' | '2xl' | 'xl' | 'lg';
export type AvatarGroupPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center-top'
  | 'center-bottom';
export type AvatarGroupStyle = {
  container: { [key in AvatarGroupSize]: ViewStyle };
  item: { [key in AvatarGroupSize]: ViewStyle };
  text: {
    base: TextStyle;
  } & { [key in AvatarGroupSize]: TextStyle };
} & {
  [key in AvatarGroupPosition]: ViewStyle;
};

type CallControlsButtonStyle = {
  container: ViewStyle;
  badge: ViewStyle;
};

export type Theme = {
  foundations: Required<IStreamTokens['foundations']>;
  components: Required<IStreamTokens['components']>;
  semantics: Required<IStreamTokens['semantics']>;
  primitives: Required<IStreamTokens['primitives']>;

  avatar: AvatarStyle;
  avatarGroup: AvatarGroupStyle;
  button: BaseButtonStyle;

  lobby: {
    container?: ViewStyle;
    topContainer: ViewStyle;
    icon: { color: ColorValue };
    headerText: TextStyle;
    videoContainer: ViewStyle;
    bottomContainer: ViewStyle;
    statusContainer: ViewStyle;
    avatarContainer?: ViewStyle;
  };

  callAppBar: {
    container: ViewStyle;
  };
  callControlsButton: {
    container: ViewStyle;
    badge: ViewStyle;
  };
  acceptCallButton?: Partial<CallControlsButtonStyle>;
  hangupCallButton?: Partial<CallControlsButtonStyle>;
  rejectCallButton?: Partial<CallControlsButtonStyle>;
  screenShareToggleButton?: Partial<CallControlsButtonStyle>;
  toggleAudioPreviewButton?: Partial<CallControlsButtonStyle>;
  toggleAudioPublishingButton?: Partial<CallControlsButtonStyle>;
  toggleCameraFaceButton?: Partial<CallControlsButtonStyle>;
  toggleVideoPreviewButton?: Partial<CallControlsButtonStyle>;
  toggleVideoPublishingButton?: Partial<CallControlsButtonStyle>;

  callDurationIndicator: {
    container: ViewStyle;
    text: TextStyle;
    textHighlight: TextStyle;
  };
  callContent?: Partial<{
    container: ViewStyle;
    callParticipantsContainer: ViewStyle;
    topContainer: ViewStyle;
  }>;
  callControls: Partial<{ container: ViewStyle }>;

  floatingParticipantsView: {
    container: ViewStyle;
    participantViewContainer: ViewStyle;
    videoFallback: ViewStyle;
  };
  callParticipantsList: {
    container: ViewStyle;
    participantWrapperHorizontal: ViewStyle;
    participant: ViewStyle;
    participantNoGrid: ViewStyle;
  };
  callParticipantsGrid?: {
    container: ViewStyle;
  };
  callParticipantsSpotlight: Partial<{
    container: ViewStyle;
    fullScreenSpotlightContainer: ViewStyle;
    callParticipantsListContainer: ViewStyle;
    spotlightContainer: ViewStyle;
  }>;

  participantLabel: {
    container: ViewStyle;
    userNameLabel: TextStyle;
    iconContainer: ViewStyle;
  };
  participantNetworkQualityIndicator: {
    container: ViewStyle;
  };
  participantReaction: {
    container: ViewStyle;
    reaction: TextStyle;
  };
  participantVideoFallback: {
    container: ViewStyle;
    label: TextStyle;
    avatar: DeepPartial<AvatarStyle>;
  };
  participantView: {
    container: ViewStyle;
    headerContainer: ViewStyle;
    footerContainer: ViewStyle;
    highlightedContainer: ViewStyle;
  };
  videoRenderer: {
    container: ViewStyle;
    videoStream: ViewStyle;
  };
  ringingCallContent?: {
    container: ViewStyle;
  };
  incomingCall: {
    content: ViewStyle;
    topContainer: ViewStyle;
    incomingCallText: TextStyle;
    bottomContainer: ViewStyle;
    buttonGroup: ViewStyle;
    button: ViewStyle;
    buttonText: TextStyle;
  };
  outgoingCall: {
    container?: ViewStyle;
    background: ViewStyle;
    content: ViewStyle;
    callingText: TextStyle;
    buttonGroup: ViewStyle;
    deviceControlButtons: ViewStyle;
  };
  userInfo: {
    container: ViewStyle;
    name: TextStyle;
    nameVariants: {
      primary: TextStyle;
      accent: TextStyle;
    };
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
  livestreamMediaControls: {
    container: ViewStyle;
  };
  screenshareOverlay: {
    container: ViewStyle;
    text: TextStyle;
    button: ViewStyle;
    buttonIcon: ViewStyle;
    buttonText: TextStyle;
  };

  insets: Insets;
  // Index signature for additional dynamic properties
  [component: string]: any;
};

export const resolveTheme = (isDark: boolean): Theme => {
  const theme = isDark ? tokens.dark : tokens.light;
  return {
    foundations: theme.foundations,
    semantics: theme.semantics,
    components: theme.components,
    primitives: theme.primitives,

    //Call controls
    callAppBar: {
      container: {
        padding: theme.primitives.spacingSm,
        gap: theme.primitives.spacingXs,
      },
    },
    callControls: {
      container: {
        padding: theme.primitives.spacingSm,
        gap: theme.primitives.spacingXs,
      },
    },
    callControlsButton: {
      container: {
        width: theme.foundations.layout.size40,
        height: theme.foundations.layout.size40,
        margin: theme.foundations.spacing.space4,
        borderRadius: theme.components.buttonRadiusFull,
      },
      badge: {
        width: theme.foundations.layout.size20,
        height: theme.foundations.layout.size20,
        backgroundColor: theme.semantics.badgeBgError,
        borderRadius: theme.foundations.radius.radius12,
        borderColor: theme.semantics.badgeBorder,
        borderWidth: theme.foundations.stroke.w200,
      },
    },

    //Ringing call content
    incomingCall: {
      content: {
        backgroundColor: theme.semantics.backgroundCoreApp,
      },
      topContainer: {
        gap: theme.primitives.spacingXs,
      },
      incomingCallText: {
        marginTop: theme.foundations.spacing.space16,
        fontSize: theme.primitives.typographyFontSizeMd,
        fontWeight: theme.primitives.typographyFontWeightRegular,
        color: theme.semantics.textSecondary,
      },
      bottomContainer: {},
      buttonGroup: {
        gap: theme.foundations.spacing.space80,
      },
      button: {
        gap: theme.foundations.spacing.space12,
        alignItems: 'center',
      },
      buttonText: {
        fontSize: theme.primitives.typographyFontSizeSm,
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
        color: theme.semantics.textSecondary,
      },
    },
    outgoingCall: {
      container: {
        backgroundColor: theme.semantics.backgroundCoreScrim,
      },
      background: {
        backgroundColor: theme.semantics.backgroundCoreApp,
      },
      content: {
        gap: theme.primitives.spacingXs,
      },
      callingText: {
        fontSize: theme.primitives.typographyFontSizeMd,
        fontWeight: theme.primitives.typographyFontWeightRegular,
        color: theme.semantics.textOnAccent,
      },
      buttonGroup: {},
      deviceControlButtons: {},
    },
    acceptCallButton: {
      container: {
        width: theme.foundations.layout.size64,
        height: theme.foundations.layout.size64,
        margin: theme.foundations.spacing.space0,
        borderRadius: theme.components.buttonRadiusFull,
      },
    },
    rejectCallButton: {
      container: {
        width: theme.foundations.layout.size64,
        height: theme.foundations.layout.size64,
        margin: theme.foundations.spacing.space0,
        borderRadius: theme.components.buttonRadiusFull,
      },
    },

    //Lobby
    lobby: {
      bottomContainer: {
        paddingTop: theme.foundations.spacing.space32,
      },
      topContainer: {
        gap: theme.foundations.spacing.space24,
        paddingBottom: theme.foundations.spacing.space32,
      },
      icon: {
        color: theme.semantics.accentPrimary,
      },
      headerText: {
        fontSize: theme.primitives.typographyFontSizeXl,
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
        color: theme.semantics.textPrimary,
      },
      videoContainer: {
        borderRadius: theme.primitives.radius2xl,
        backgroundColor: theme.semantics.backgroundCoreSurfaceSubtle,
        borderColor: theme.semantics.borderCoreDefault,
        borderWidth: theme.foundations.stroke.w100,
      },
      statusContainer: {
        padding: theme.primitives.spacingXs,
        gap: theme.primitives.spacingXxs,
      },
    },
    lobbyControls: {
      container: {
        paddingTop: theme.foundations.spacing.space12,
      },
    },

    //Participant components
    participantView: {
      container: {
        borderRadius: theme.primitives.radius2xl,
      },
      headerContainer: {
        padding: theme.primitives.spacingXs,
        gap: theme.primitives.spacingXxs,
      },
      footerContainer: {
        padding: theme.primitives.spacingXs,
        gap: theme.primitives.spacingXxs,
      },
      highlightedContainer: {
        borderColor: theme.semantics.accentPrimary,
      },
    },
    participantLabel: {
      container: {
        height: theme.foundations.layout.size32,
        backgroundColor: theme.semantics.backgroundCoreOverlayDarkStrong,
        paddingVertical: theme.primitives.spacingXxs,
        paddingLeft: theme.primitives.spacingSm,
        paddingRight: theme.primitives.spacingXxs,
        maxHeight: theme.foundations.layout.size32,
        borderRadius: theme.primitives.radiusLg,
        gap: theme.foundations.spacing.space8,
      },
      userNameLabel: {
        fontSize: theme.primitives.typographyFontSizeSm,
        fontWeight: theme.primitives.typographyFontWeightRegular,
        color: theme.semantics.textOnAccent,
      },
      iconContainer: {
        gap: theme.primitives.spacingXxs,
      },
    },
    participantNetworkQualityIndicator: {
      container: {
        width: theme.foundations.layout.size32,
        height: theme.foundations.layout.size32,
        borderRadius: theme.foundations.radius.radiusFull,
        backgroundColor: theme.semantics.backgroundCoreOverlayDarkStrong,
      },
    },
    participantVideoFallback: {
      container: {
        borderRadius: theme.primitives.radius2xl,
        backgroundColor: theme.semantics.backgroundCoreSurfaceSubtle,
        borderWidth: theme.foundations.stroke.w100,
        borderColor: theme.semantics.borderCoreDefault,
      },
      label: {},
      avatar: {
        container: {
          base: {
            width: theme.foundations.layout.size80,
            height: theme.foundations.layout.size80,
            borderRadius: theme.foundations.radius.radiusFull,
          },
        },
      },
    },
    floatingParticipantsView: {
      container: {},
      participantViewContainer: {},
      videoFallback: {
        backgroundColor: theme.semantics.backgroundCoreSurfaceDefault,
      },
    },

    //Layout components
    callParticipantsList: {
      container: {
        paddingHorizontal: theme.primitives.spacingXxs,
      },
      participantWrapperHorizontal: {
        marginHorizontal: theme.primitives.spacingXxs,
      },
      participant: {
        margin: theme.primitives.spacingXxs,
      },
      participantNoGrid: {
        marginHorizontal: theme.primitives.spacingXxs,
      },
    },
    callParticipantsSpotlight: {
      spotlightContainer: {
        borderRadius: theme.primitives.radius2xl,
        marginHorizontal: theme.primitives.spacingXs,
      },
      fullScreenSpotlightContainer: {
        marginHorizontal: theme.primitives.spacingXxs,
      },
      callParticipantsListContainer: {
        marginTop: theme.primitives.spacingXxs,
      },
    },

    //Livestream components
    livestreamLayout: {
      container: {
        borderRadius: theme.primitives.radius2xl,
        marginHorizontal: theme.primitives.spacingXxs,
      },
    },
    viewerLivestreamTopView: {
      container: {
        padding: theme.primitives.spacingSm,
        gap: theme.primitives.spacingXs,
      },
      leftElement: {},
      centerElement: {},
      rightElement: {},
      liveInfo: {},
    },
    followerCount: {
      container: {
        minWidth: theme.foundations.layout.size32,
        paddingVertical: theme.foundations.spacing.space6,
        paddingHorizontal: theme.primitives.spacingXs,
        gap: theme.primitives.spacingXs,
        borderRadius: theme.foundations.radius.radiusFull,
        backgroundColor: theme.semantics.backgroundCoreSurfaceDefault,
      },
      label: {
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
        fontSize: theme.primitives.typographyFontSizeMd,
        color: theme.semantics.textPrimary,
      },
    },
    liveIndicator: {
      container: {},
      label: {},
    },
    livestreamMediaControls: {
      container: {},
    },

    //Livestream host
    hostLivestream: {
      container: {},
    },
    hostLivestreamTopView: {
      container: {
        padding: theme.primitives.spacingSm,
        gap: theme.primitives.spacingXs,
      },
      leftElement: {},
      rightElement: {},
      centerElement: {},
      liveInfo: {},
    },
    hostLivestreamControls: {
      container: {
        padding: theme.primitives.spacingSm,
        gap: theme.primitives.spacingXs,
      },
      leftElement: {},
      rightElement: {},
    },

    //Livestream viewer
    viewerLivestream: {
      container: {},
    },
    viewerLivestreamControls: {
      container: {
        padding: theme.primitives.spacingSm,
        gap: theme.primitives.spacingXs,
      },
      leftElement: {
        gap: theme.primitives.spacingXs,
      },
      rightElement: {},
    },
    livestreamViewerLobby: {
      container: {
        backgroundColor: theme.semantics.backgroundCoreApp,
        padding: theme.primitives.spacingLg,
      },
      text: {
        fontSize: theme.primitives.typographyFontSizeMd,
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
        color: theme.semantics.textPrimary,
      },
      countdownText: {
        fontSize: theme.primitives.typographyFontSizeMd,
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
        color: theme.semantics.textPrimary,
      },
      participantsText: {
        fontSize: theme.primitives.typographyFontSizeMd,
      },
    },

    //Others
    avatar: {
      container: {
        base: {
          backgroundColor: theme.semantics.avatarBgDefault,
          borderRadius: theme.foundations.radius.radiusFull,
        },
        '3xl': {
          width: 104,
          height: 104,
        },
        '2xl': {
          width: theme.foundations.layout.size80,
          height: theme.foundations.layout.size80,
        },
        xl: {
          width: theme.foundations.layout.size48,
          height: theme.foundations.layout.size48,
        },
        lg: {
          width: theme.foundations.layout.size40,
          height: theme.foundations.layout.size40,
        },
        md: {
          width: theme.foundations.layout.size32,
          height: theme.foundations.layout.size32,
        },
        sm: {
          width: theme.foundations.layout.size24,
          height: theme.foundations.layout.size24,
        },
        xs: {
          width: theme.foundations.layout.size20,
          height: theme.foundations.layout.size20,
        },
      },
      text: {
        base: {
          color: theme.semantics.avatarTextDefault,
          fontWeight: theme.primitives.typographyFontWeightSemiBold,
        },
        '3xl': {
          fontSize: theme.primitives.typographyFontSizeXl,
        },
        '2xl': {
          fontSize: theme.primitives.typographyFontSizeXl,
        },
        xl: {
          fontSize: theme.primitives.typographyFontSizeLg,
        },
        lg: {
          fontSize: theme.primitives.typographyFontSizeMd,
        },
        md: {
          fontSize: theme.primitives.typographyFontSizeSm,
        },
        sm: {
          fontSize: theme.primitives.typographyFontSizeSm,
        },
        xs: {
          fontSize: theme.primitives.typographyFontSizeXs,
        },
      },
    },
    avatarGroup: {
      container: {
        '3xl': {
          width: 104,
          height: 104,
        },
        '2xl': {
          width: theme.foundations.layout.size80,
          height: theme.foundations.layout.size80,
        },
        xl: {
          width: theme.foundations.layout.size48,
          height: theme.foundations.layout.size48,
        },
        lg: {
          width: theme.foundations.layout.size40,
          height: theme.foundations.layout.size40,
        },
      },
      item: {
        '3xl': {
          width:
            theme.foundations.layout.size64 + theme.foundations.stroke.w200,
          height:
            theme.foundations.layout.size64 + theme.foundations.stroke.w200,
        },
        '2xl': {
          width:
            theme.foundations.layout.size48 + theme.foundations.stroke.w200,
          height:
            theme.foundations.layout.size48 + theme.foundations.stroke.w200,
        },
        xl: {
          width:
            theme.foundations.layout.size32 + theme.foundations.stroke.w200,
          height:
            theme.foundations.layout.size32 + theme.foundations.stroke.w200,
        },
        lg: {
          width:
            theme.foundations.layout.size24 + theme.foundations.stroke.w200,
          height:
            theme.foundations.layout.size24 + theme.foundations.stroke.w200,
        },
      },
      'top-left': {
        position: 'absolute',
        borderColor: theme.semantics.borderCoreOnInverse,
        borderWidth: theme.foundations.stroke.w200,
        left: -0.5 * theme.foundations.stroke.w200,
        top: -0.5 * theme.foundations.stroke.w200,
      },
      'top-right': {
        position: 'absolute',
        borderColor: theme.semantics.borderCoreOnInverse,
        borderWidth: theme.foundations.stroke.w200,
        right: -0.5 * theme.foundations.stroke.w200,
        top: -0.5 * theme.foundations.stroke.w200,
      },
      'bottom-left': {
        position: 'absolute',
        borderColor: theme.semantics.borderCoreOnInverse,
        borderWidth: theme.foundations.stroke.w200,
        left: -0.5 * theme.foundations.stroke.w200,
        bottom: -0.5 * theme.foundations.stroke.w200,
      },
      'bottom-right': {
        position: 'absolute',
        borderColor: theme.semantics.borderCoreOnInverse,
        borderWidth: theme.foundations.stroke.w200,
        right: -0.5 * theme.foundations.stroke.w200,
        bottom: -0.5 * theme.foundations.stroke.w200,
      },
      'center-top': {
        position: 'absolute',
        borderColor: theme.semantics.borderCoreOnInverse,
        borderWidth: theme.foundations.stroke.w200,
        left: '20%',
        top: -0.5 * theme.foundations.stroke.w200,
      },
      'center-bottom': {
        position: 'absolute',
        borderColor: theme.semantics.borderCoreOnInverse,
        borderWidth: theme.foundations.stroke.w200,
        left: '20%',
        bottom: -0.5 * theme.foundations.stroke.w200,
      },
      text: {
        base: {
          fontWeight: theme.primitives.typographyFontWeightBold,
          color: theme.semantics.badgeText,
        },
        '3xl': {
          fontSize: theme.primitives.typographyFontSizeLg,
        },
        '2xl': {
          fontSize: theme.primitives.typographyFontSizeSm,
        },
        xl: {
          fontSize: theme.primitives.typographyFontSizeSm,
        },
        lg: {
          fontSize: theme.primitives.typographyFontSizeXxs,
        },
      },
    },
    button: {
      container: {
        borderRadius: theme.components.buttonRadiusFull,
      },
      small: {
        height: theme.foundations.layout.size32,
        paddingHorizontal: theme.components.buttonPaddingXWithLabelSm,
        minWidth: theme.foundations.layout.size32,
      },
      medium: {
        height: theme.foundations.layout.size40,
        borderRadius: theme.components.buttonRadiusFull,
        paddingHorizontal: theme.components.buttonPaddingXWithLabelMd,
        minWidth: theme.foundations.layout.size40,
      },
      large: {
        height: theme.foundations.layout.size48,
        borderRadius: theme.components.buttonRadiusFull,
        paddingHorizontal: theme.components.buttonPaddingXWithLabelLg,
        minWidth: theme.foundations.layout.size48,
      },
      primary: {
        container: {
          backgroundColor: theme.semantics.buttonPrimaryBg,
        },
        text: {
          fontSize: theme.primitives.typographyFontSizeMd,
          fontWeight: theme.primitives.typographyFontWeightSemiBold,
          color: theme.semantics.buttonPrimaryTextOnAccent,
        },
      },
      secondary: {
        container: {
          backgroundColor: theme.semantics.buttonSecondaryBg,
        },
        text: {
          fontSize: theme.primitives.typographyFontSizeMd,
          fontWeight: theme.primitives.typographyFontWeightSemiBold,
          color: theme.semantics.buttonSecondaryTextOnAccent,
        },
      },
      destructive: {
        container: {
          backgroundColor: theme.semantics.buttonDestructiveBg,
        },
        text: {
          fontSize: theme.primitives.typographyFontSizeMd,
          fontWeight: theme.primitives.typographyFontWeightSemiBold,
          color: theme.semantics.buttonDestructiveTextOnAccent,
        },
      },
      disabled: {
        container: {
          backgroundColor: theme.semantics.backgroundUtilityDisabled,
        },
        text: {
          color: theme.semantics.textDisabled,
        },
      },
      content: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.foundations.spacing.space8,
      },
      accessory: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
      },
    },
    participantReaction: {
      container: {
        width: theme.foundations.layout.size64,
        height: theme.foundations.layout.size64,
        padding: theme.primitives.spacingXs,
      },
      reaction: {
        fontSize: theme.components.emojiXl,
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
      },
    },
    reactionsPicker: {
      reactionsPopup: {
        paddingTop: theme.primitives.spacingXs,
      },
      reactionsButtonDimmer: {
        backgroundColor: theme.semantics.backgroundCoreScrim,
        borderRadius: theme.foundations.radius.radiusFull,
      },
      reactionItem: {
        backgroundColor: theme.semantics.backgroundCoreSurfaceDefault,
        marginBottom: theme.primitives.spacingXs,
      },
      reactionText: {
        fontSize: theme.primitives.typographyFontSizeMd,
      },
    },
    callDurationIndicator: {
      container: {
        paddingVertical: theme.foundations.spacing.space6,
        paddingHorizontal: theme.primitives.spacingXs,
        gap: theme.primitives.spacingXs,
        borderRadius: theme.foundations.radius.radiusFull,
        backgroundColor: theme.semantics.backgroundCoreSurfaceDefault,
      },
      text: {
        fontSize: theme.primitives.typographyFontSizeMd,
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
        color: theme.semantics.textPrimary,
      },
      textHighlight: {
        color: theme.semantics.textTertiary,
      },
    },
    videoRenderer: {
      container: {
        borderRadius: theme.primitives.radius2xl,
      },
      videoStream: {},
    },
    userInfo: {
      container: {
        gap: theme.primitives.spacingMd,
        paddingHorizontal: theme.primitives.spacingXl,
      },
      name: {
        fontSize: theme.primitives.typographyFontSizeXl,
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
      },
      nameVariants: {
        primary: {
          color: theme.semantics.textPrimary,
        },
        accent: {
          color: theme.semantics.textOnAccent,
        },
      },
    },
    screenshareOverlay: {
      container: {
        gap: theme.primitives.spacingMd,
      },
      text: {
        fontSize: theme.primitives.typographyFontSizeMd,
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
        color: theme.semantics.textPrimary,
      },
      button: {
        padding: theme.primitives.spacingSm,
        gap: theme.primitives.spacingXs,
      },
      buttonIcon: {},
      buttonText: {
        fontSize: theme.primitives.typographyFontSizeMd,
        fontWeight: theme.primitives.typographyFontWeightSemiBold,
        color: theme.semantics.textPrimary,
      },
    },

    //legacy
    insets: {
      top: theme.foundations.spacing.space0,
      right: theme.foundations.spacing.space0,
      bottom: theme.foundations.spacing.space0,
      left: theme.foundations.spacing.space0,
    },
  };
};

export const defaultTheme = resolveTheme(false);
