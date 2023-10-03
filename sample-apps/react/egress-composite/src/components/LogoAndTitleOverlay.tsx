import { useConfigurationContext } from '../ConfigurationContext';

import './LogoAndTitle.scss';

export const LogoAndTitleOverlay = () => {
  const {
    options: { 'logo.image_url': imageURL, 'title.text': titleText },
  } = useConfigurationContext();

  return (
    <div
      data-testid="logo-and-title-overlay"
      className="eca__logo-and-title-overlay"
    >
      {titleText?.length && (
        <span
          className="eca__logo-and-title-overlay__title"
          data-testid="title"
        >
          {titleText}
        </span>
      )}
      {imageURL && (
        <img
          className="eca__logo-and-title-overlay__logo"
          data-testid="logo"
          src={imageURL}
          alt="logo"
        />
      )}
    </div>
  );
};
