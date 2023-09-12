import { useConfigurationContext } from '../ConfigurationContext';

export const LogoAndTitleOverlay = () => {
  const { options } = useConfigurationContext();

  const image_url = options['logo.image_url'];

  return (
    <div
      style={{
        top: 0,
        left: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
      }}
    >
      {/* {text?.length && (
          <div
            data-testid="title"
            style={{ ...DEFAULT_TITLE_STYLE, ...titleStyle }}
          >
            {text}
          </div>
        )} */}
      {image_url && (
        <img
          data-testid="logo"
          src={image_url}
          // style={{ ...DEFAULT_LOGO_STYLE, ...logoStyle }}
          alt="logo"
        />
      )}
    </div>
  );
};
