import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@stream-io/video-react-native-sdk';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { useAppI18n } from '../hooks/useAppI18n';

type AppSettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export const AppSettingsSheet = ({
  visible,
  onClose,
}: AppSettingsSheetProps) => {
  const styles = useStyles();
  const { t } = useAppI18n();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const setState = useAppGlobalStoreSetState();
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const devMode = useAppGlobalStoreValue((store) => store.devMode);
  const showRingStateDebugPane = useAppGlobalStoreValue(
    (store) => store.showRingStateDebugPane,
  );

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      >
        <Text style={styles.title}>
          {t('appSettings.title.text', 'Settings')}
        </Text>
        <SettingRow
          label={t('appSettings.darkMode.label', 'Dark mode')}
          value={themeMode === 'dark'}
          onValueChange={(enabled) =>
            setState({ themeMode: enabled ? 'dark' : 'light' })
          }
        />
        {(__DEV__ || devMode) && (
          <SettingRow
            label={t('appSettings.ringStatePanel.label', 'Ring state panel')}
            value={!!showRingStateDebugPane}
            onValueChange={(enabled) =>
              setState({ showRingStateDebugPane: enabled })
            }
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const SettingRow = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics, primitives },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        background: {
          backgroundColor: semantics.backgroundCoreElevation2,
          borderTopLeftRadius: primitives.radiusXl,
          borderTopRightRadius: primitives.radiusXl,
        },
        handleIndicator: {
          backgroundColor: semantics.borderCoreDefault,
        },
        content: {
          paddingHorizontal: primitives.spacingLg,
        },
        title: {
          fontSize: primitives.typographyFontSizeLg,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
          marginBottom: primitives.spacingSm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: primitives.spacingMd,
        },
        rowLabel: {
          fontSize: primitives.typographyFontSizeMd,
          color: semantics.textPrimary,
        },
      }),
    [semantics, primitives],
  );
};
