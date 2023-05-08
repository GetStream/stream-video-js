import { SettingsController } from './SettingsDialog';
import { TranslationLanguage } from '@stream-io/video-react-sdk';
import { Settings } from '../../context/SettingsContext';
import {
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';

const LANGUAGES: Record<TranslationLanguage, string> = {
  de: 'German',
  en: 'English',
  es: 'Spanish',
};

export type LanguageMenuProps = Pick<SettingsController, 'setLanguage'> &
  Pick<Settings, 'language'>;

export const LanguageMenu = ({ language, setLanguage }: LanguageMenuProps) => {
  return (
    <Stack>
      <Typography variant="caption" color="#72767e">
        Language of the Meeting
      </Typography>
      <FormControl fullWidth>
        <Select
          value={language?.split('-')[0]}
          label="Language"
          onChange={(e) => {
            setLanguage(e.target.value);
          }}
          sx={{ fontSize: '0.875rem' }}
        >
          {Object.entries(LANGUAGES).map(([lngCode, languageName]) => (
            <MenuItem key={`settings-language-${lngCode}`} value={lngCode}>
              {languageName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};
