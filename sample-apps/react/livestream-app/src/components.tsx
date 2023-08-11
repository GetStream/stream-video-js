import './components.scss';
import { useEffect, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

export const DurationBadge = () => {
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  const timestamp = new Date(duration * 1000).toISOString().slice(11, 19);
  return (
    <div className="duration-badge">
      <ShieldBadge />
      <span className="elapsed-time">{timestamp}</span>
    </div>
  );
};

export const LiveBadge = () => {
  return <div className="live-badge">Live</div>;
};

export const TotalViewersBadge = () => {
  const { useParticipantCount } = useCallStateHooks();
  const viewers = useParticipantCount();
  return (
    <div className="total-viewers-badge">
      <EyeBadge />
      <span className="total-viewers">{viewers}</span>
    </div>
  );
};

export const ShieldBadge = () => {
  return (
    <svg
      width="9"
      height="10"
      viewBox="0 0 9 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.79919 8.79157L4.02014 9.63654C4.22869 9.7774 4.49664 9.7774 4.70498 9.63654L5.92594 8.79157C7.6828 7.5523 8.75481 5.60898 8.75481 3.52489V1.60984C8.75481 1.35641 8.57617 1.13107 8.30822 1.07467L4.3774 0.257812L0.446587 1.07447C0.178632 1.13085 0 1.35619 0 1.60964V3.52469C0 5.60888 1.04233 7.58057 2.79919 8.79157ZM2.56093 4.05991L3.69256 5.13019L6.16414 2.79258L7.05753 3.63755L3.72223 6.82014L1.69742 4.90488L2.56093 4.05991Z"
        fill="#00E2A1"
      />
    </svg>
  );
};

export const StreamLogo = () => {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_d_6532_11548)">
        <rect
          x="2"
          y="2.07324"
          width="33.8535"
          height="33.8535"
          rx="16.9268"
          fill="#1E262E"
        />
        <g clipPath="url(#clip0_6532_11548)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.67813 17.6307L10.3944 21.402C10.4369 21.461 10.4919 21.5089 10.5551 21.5419C10.6183 21.5749 10.6881 21.592 10.7588 21.592C10.8294 21.592 10.8992 21.5749 10.9624 21.5419C11.0256 21.5089 11.0806 21.461 11.1231 21.402L13.5102 18.0876C13.7251 17.7889 13.5416 17.3608 13.1849 17.3288L8.08147 16.872C7.68893 16.8368 7.44159 17.3024 7.67813 17.6307Z"
            fill="#005FFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.67813 17.6307L10.3944 21.402C10.4369 21.461 10.4919 21.5089 10.5551 21.5419C10.6183 21.5749 10.6881 21.592 10.7588 21.592C10.8294 21.592 10.8992 21.5749 10.9624 21.5419C11.0256 21.5089 11.0806 21.461 11.1231 21.402L13.5102 18.0876C13.7251 17.7889 13.5416 17.3608 13.1849 17.3288L8.08147 16.872C7.68893 16.8368 7.44159 17.3024 7.67813 17.6307Z"
            fill="url(#paint0_linear_6532_11548)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M24.683 17.6156L19.7437 24.4733C19.5182 24.7864 19.7324 25.2334 20.108 25.2334H24.4169C24.5078 25.2334 24.5974 25.2114 24.6787 25.1689C24.76 25.1265 24.8307 25.065 24.8853 24.9891L30.175 17.6454C30.4134 17.3146 30.1605 16.8462 29.7657 16.8873L25.0935 17.3746C25.0128 17.3829 24.9346 17.4086 24.864 17.4501C24.7933 17.4916 24.7317 17.5479 24.683 17.6156Z"
            fill="#005FFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M24.683 17.6156L19.7437 24.4733C19.5182 24.7864 19.7324 25.2334 20.108 25.2334H24.4169C24.5078 25.2334 24.5974 25.2114 24.6787 25.1689C24.76 25.1265 24.8307 25.065 24.8853 24.9891L30.175 17.6454C30.4134 17.3146 30.1605 16.8462 29.7657 16.8873L25.0935 17.3746C25.0128 17.3829 24.9346 17.4086 24.864 17.4501C24.7933 17.4916 24.7317 17.5479 24.683 17.6156Z"
            fill="url(#paint1_linear_6532_11548)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M23.3203 17.6723L18.0299 25.0182C17.975 25.0945 17.9038 25.1564 17.8219 25.1988C17.74 25.2412 17.6497 25.2631 17.5582 25.2625L13.4443 25.2354C13.3542 25.2348 13.2655 25.2126 13.185 25.1704C13.1045 25.1283 13.0344 25.0673 12.9802 24.9923L11.6815 23.1967C11.605 23.0908 11.5635 22.9619 11.5634 22.8293C11.5632 22.6968 11.6044 22.5677 11.6807 22.4617L18.9979 12.3025C19.0522 12.227 19.1226 12.1657 19.2035 12.1234C19.2844 12.0811 19.3735 12.0589 19.464 12.0586C19.5545 12.0583 19.6438 12.0798 19.7249 12.1216C19.8061 12.1633 19.8769 12.2242 19.9317 12.2992L23.3177 16.9347C23.3951 17.0406 23.4373 17.1699 23.4377 17.3031C23.4382 17.4362 23.397 17.5659 23.3203 17.6723Z"
            fill="#005FFF"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M23.3203 17.6723L18.0299 25.0182C17.975 25.0945 17.9038 25.1564 17.8219 25.1988C17.74 25.2412 17.6497 25.2631 17.5582 25.2625L13.4443 25.2354C13.3542 25.2348 13.2655 25.2126 13.185 25.1704C13.1045 25.1283 13.0344 25.0673 12.9802 24.9923L11.6815 23.1967C11.605 23.0908 11.5635 22.9619 11.5634 22.8293C11.5632 22.6968 11.6044 22.5677 11.6807 22.4617L18.9979 12.3025C19.0522 12.227 19.1226 12.1657 19.2035 12.1234C19.2844 12.0811 19.3735 12.0589 19.464 12.0586C19.5545 12.0583 19.6438 12.0798 19.7249 12.1216C19.8061 12.1633 19.8769 12.2242 19.9317 12.2992L23.3177 16.9347C23.3951 17.0406 23.4373 17.1699 23.4377 17.3031C23.4382 17.4362 23.397 17.5659 23.3203 17.6723Z"
            fill="url(#paint2_linear_6532_11548)"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_d_6532_11548"
          x="-10"
          y="-5.92676"
          width="57.8535"
          height="57.8535"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_6532_11548"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_6532_11548"
            result="shape"
          />
        </filter>
        <linearGradient
          id="paint0_linear_6532_11548"
          x1="-15.4698"
          y1="-5.33952"
          x2="-22.3245"
          y2="7.81515"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.177786" stopColor="#B38AF8" />
          <stop offset="0.563822" stopColor="#005FFF" />
          <stop offset="1" stopColor="#00ECBB" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_6532_11548"
          x1="-21.0294"
          y1="-22.3833"
          x2="-34.1396"
          y2="2.66171"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.177786" stopColor="#B38AF8" />
          <stop offset="0.563822" stopColor="#005FFF" />
          <stop offset="1" stopColor="#00ECBB" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_6532_11548"
          x1="-33.9402"
          y1="-50.0463"
          x2="-57.7751"
          y2="-19.0081"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.177786" stopColor="#B38AF8" />
          <stop offset="0.563822" stopColor="#005FFF" />
          <stop offset="1" stopColor="#00ECBB" />
        </linearGradient>
        <clipPath id="clip0_6532_11548">
          <rect
            width="22.6819"
            height="13.2029"
            fill="white"
            transform="translate(7.58582 12.0596)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export const EyeBadge = () => {
  return (
    <svg
      width="15"
      height="10"
      viewBox="0 0 15 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.25488 1.5625C9.62363 1.5625 11.7361 2.89375 12.7674 5C11.7361 7.10625 9.62363 8.4375 7.25488 8.4375C4.88613 8.4375 2.77363 7.10625 1.74238 5C2.77363 2.89375 4.88613 1.5625 7.25488 1.5625ZM7.25488 0.3125C4.12988 0.3125 1.46113 2.25625 0.379883 5C1.46113 7.74375 4.12988 9.6875 7.25488 9.6875C10.3799 9.6875 13.0486 7.74375 14.1299 5C13.0486 2.25625 10.3799 0.3125 7.25488 0.3125ZM7.25488 3.4375C8.11738 3.4375 8.81738 4.1375 8.81738 5C8.81738 5.8625 8.11738 6.5625 7.25488 6.5625C6.39238 6.5625 5.69238 5.8625 5.69238 5C5.69238 4.1375 6.39238 3.4375 7.25488 3.4375ZM7.25488 2.1875C5.70488 2.1875 4.44238 3.45 4.44238 5C4.44238 6.55 5.70488 7.8125 7.25488 7.8125C8.80488 7.8125 10.0674 6.55 10.0674 5C10.0674 3.45 8.80488 2.1875 7.25488 2.1875Z"
        fill="#FCFCFC"
      />
    </svg>
  );
};

export const LeaveBadge = () => {
  return (
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.75 5.75L16.9875 7.5125L20.2125 10.75H7.5V13.25H20.2125L16.9875 16.475L18.75 18.25L25 12L18.75 5.75ZM2.5 3.25H12.5V0.75H2.5C1.125 0.75 0 1.875 0 3.25V20.75C0 22.125 1.125 23.25 2.5 23.25H12.5V20.75H2.5V3.25Z"
        fill="#FCFCFC"
      />
    </svg>
  );
};

export const HDBadge = () => {
  return (
    <svg
      width="30"
      height="20"
      viewBox="0 0 30 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="30" height="20" rx="4" fill="#005FFF" fillOpacity="0.16" />
      <path
        d="M12.75 8.51562V9.74219H6.59375V8.51562H12.75ZM6.82812 3.625V15H5.32031V3.625H6.82812ZM14.0625 3.625V15H12.5625V3.625H14.0625ZM19.8203 15H17.4453L17.4609 13.7734H19.8203C20.6328 13.7734 21.3099 13.6042 21.8516 13.2656C22.3932 12.9219 22.7995 12.4427 23.0703 11.8281C23.3464 11.2083 23.4844 10.4844 23.4844 9.65625V8.96094C23.4844 8.3099 23.4062 7.73177 23.25 7.22656C23.0938 6.71615 22.8646 6.28646 22.5625 5.9375C22.2604 5.58333 21.8906 5.3151 21.4531 5.13281C21.0208 4.95052 20.5234 4.85938 19.9609 4.85938H17.3984V3.625H19.9609C20.7057 3.625 21.3854 3.75 22 4C22.6146 4.24479 23.1432 4.60156 23.5859 5.07031C24.0339 5.53385 24.3776 6.09635 24.6172 6.75781C24.8568 7.41406 24.9766 8.15365 24.9766 8.97656V9.65625C24.9766 10.4792 24.8568 11.2214 24.6172 11.8828C24.3776 12.5391 24.0312 13.099 23.5781 13.5625C23.1302 14.026 22.5885 14.3828 21.9531 14.6328C21.3229 14.8776 20.612 15 19.8203 15ZM18.25 3.625V15H16.7422V3.625H18.25Z"
        fill="#005FFF"
      />
    </svg>
  );
};
