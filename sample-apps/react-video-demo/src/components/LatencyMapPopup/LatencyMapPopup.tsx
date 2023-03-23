import { FC } from 'react';

export type Props = {
  abbriviation: string;
  city: string;
  countryCode: string;
};

export const LatencyMapPopup: FC<Props> = ({
  abbriviation,
  city,
  countryCode,
}) => (
  <div className="relative">
    <div className="bg-video-white rounded p-3">
      <h3 className="font-bold flex items-center">
        <span className="bg-green block rounded-full w-2 h-2 mr-2"></span>
        {abbriviation}
      </h3>
      <p className="font-inter text-sm text-map-popup-description">
        {city}, {countryCode}
      </p>
    </div>
    <div className="w-8 overflow-hidden inline-block absolute top-18  ml-2">
      <div className="h-3 w-3 bg-video-white -rotate-45 transform origin-top-left"></div>
    </div>
  </div>
);
