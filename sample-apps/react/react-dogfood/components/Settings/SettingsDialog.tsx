import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { Box, Stack } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import clsx from 'clsx';
import { LanguageMenu } from './LanguageMenu';
import { Settings } from '../../context/SettingsContext';

const CATEGORIES = [{ name: 'language', Icon: TranslateIcon }] as const;
export type SettingsCategory = (typeof CATEGORIES)[number]['name'];

export type SettingsController = {
  setLanguage: (lng: string) => void;
};

export interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  controller: SettingsController;
  settings: Settings;
}

export const SettingsDialog = (props: SettingsDialogProps) => {
  const { onClose, open, controller, settings } = props;
  const { setLanguage } = controller;
  const { language } = settings;
  const [activeTab, setTab] = useState<SettingsCategory>(CATEGORIES[0].name);

  return (
    <Dialog onClose={onClose} open={open}>
      <Stack sx={{ width: '500px', height: '300px' }}>
        <Stack direction="row" sx={{ height: '100%' }}>
          <Stack
            sx={{
              borderRight: '1px solid #eee',
              overflowY: 'auto',
              paddingRight: '0.5rem',
            }}
          >
            <Box
              sx={{
                padding: '1rem',
                fontSize: '1.5rem',
                fontWeight: '300',
              }}
            >
              Settings
            </Box>
            {CATEGORIES.map(({ name, Icon }) => (
              <Box
                sx={{
                  padding: '1rem 1.75rem 1rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textTransform: 'capitalize',
                  borderRadius: '0 999px 999px 0',
                  '&.rd_settings-tab-label--active': {
                    background: '#337eff40',
                    color: '#005fff',
                  },
                }}
                className={clsx('rd_settings-tab-label', {
                  'rd_settings-tab-label--active': name === activeTab,
                })}
                key={name}
                onClick={() => {
                  if (name !== activeTab) setTab(name);
                }}
              >
                <Stack direction="row" gap={1}>
                  <Icon sx={{ height: '1.25rem' }} />
                  {name}
                </Stack>
              </Box>
            ))}
          </Stack>
          <Stack
            sx={{ padding: '2rem 1.5rem', overflowY: 'auto', flexGrow: 1 }}
          >
            {activeTab === 'language' && (
              <LanguageMenu setLanguage={setLanguage} language={language} />
            )}
          </Stack>
        </Stack>
      </Stack>
    </Dialog>
  );
};
