/* eslint-disable */
const tailwindGradients = require('tailwindcss-plugins/gradients');
const colors = require('tailwindcss/colors');

const baseFallbackFonts = [
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Oxygen-Sans',
  'Ubuntu',
  'Cantarell',
  'Helvetica Neue',
  'sans-serif',
];
module.exports = {
  content: [
    "./src/components/**/*.{html, js, ts, tsx}",
    "./src/**/*"
  ],
  theme: {
    borderWidth: {
      default: '1px',
      DEFAULT: '1px',
      0: '0px',
      2: '2px',
      3: '3px',
      4: '4px',
      6: '6px',
      8: '8px',
      10: '10px',
      12: '12px',
    },
    fontFamily: {
      display: ['Inter Display Var', ...baseFallbackFonts],
      displayItalic: ['Inter Display Var Italic', ...baseFallbackFonts],
      displayFallback: ['Inter Display', ...baseFallbackFonts],
      body: ['Inter Var', ...baseFallbackFonts],
      bodyItalic: ['Inter Var Italic', ...baseFallbackFonts],
      bodyFallback: ['Inter', ...baseFallbackFonts],
      realtime: ['Realtime Text', ...baseFallbackFonts],
      realtimeSerif: ['Realtime', ...baseFallbackFonts],
    },
    fontSize: {
      xs: '.75rem',
      sm: '.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.375rem',
      '3xl': '1.875rem',
      '4xl': '2.5rem',
      '5xl': '3rem',
      '6xl': '4rem',
    },
    colors: {
      map: {
        marker: {
          highlight: 'rgba(30, 177, 20, 0.2)',
          green: '#20E070',
          blue: '#2F7DEB',
        },
        popup: {
          description: '#72767E'
        }
      }
    },
    gradients: {
      button: ['180deg', 'rgba(0, 138, 255, 0.95)', 'rgba(0, 138, 255, 1)'],
      linkbox: ['180deg', 'rgba(0,0,0,0.02)', 'rgba(0,0,0,0.00)'],
    },
    boxShadow: {
      default: '0 2px 18px 0 rgba(0,0,0,0.04)',
      DEFAULT: '0 2px 18px 0 rgba(0,0,0,0.04)',
      strong: '0 2px 18px 0 rgba(0,0,0,0.1)',
      blue: '0 2px 19px rgba(0, 0, 0, 0.25), 0 7px 32px #21B5E3, inset 0 1px 23px 0 rgba(8, 231, 255, 0.2)',
      button: '0 1px 1px 0 rgba(0, 94, 173, 1), 0 3px 13px 0 rgba(0, 125, 238, 0.32)',
      'button-default': '0 3px 13px 0 rgba(0,0,0,0.32)',
      'button-hover': '0 3px 13px 1px rgba(0,0,0,0.35)',
      'button-light': '0 3px 13px 0 rgba(0,0,0,0.08)',
      icon: '0 2px 4px 0 rgba(0,0,0,0.06), 0 7px 32px 0 rgba(33,181,227,0.28)',
      popup: '0 50px 100px rgba(50, 50, 93, 0.1), 0 15px 35px rgba(50, 50, 93, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1)',
      sidebar: '0 2px 30px 0 rgba(0,0,0,0.10)',
      'product-card': '0 2px 30px rgba(0,0,0,0.1)',
      'demo-card': '0 0 25px rgba(0,0,0,0.26)',
      footer: 'inset 0 1px 0 0 rgba(0,0,0,0.07), inset 0 8px 7px 0 rgba(0,0,0,0.01)',
      dialog: '0 5px 10px 0 rgba(0,0,0,0.06)',
      main: '0px 0px 30px 12px rgb(238 238 238)',
      card: '0px 0px 3px 0px rgba(0,0,0,0.06)',
      cardActive: '0px 0px 20px 0px rgba(0,0,0,0.06)',
    },


    extend: {
      borderRadius: {
        panel: '13px', // rounded-container // rounded-demo-container
        button: '8px',
        container: '13px',
        input: '6px'
      },
      colors: {
        video: {
          white: '#fff',
          black: '#000',
          transparent: 'transparent',
          stream: {
            200: '#2F7DEB',
            400: '#006CFF',
            500: '#005FFF',
            600: '#0055e5',
            700: '#004CCC',
          },
          grey: {
            100: '#B4B7BB',
            200: '#979797',
            300: '#4C525C',
            350: '#1e2024',
            400: '#72767E',
            450: '#272A30',
            500: '#1C1E22',
            600: '#212326',
            700: '#272A30',
            800: '#121416'
          },
          green: {
            500: '#20E070',
          },
          red: {
            300: '#ED2833',
            400: '#FF3742',
            500: '#FF482F',
            600: '#FF1A24',
          },
          yellow: {
            500: '#FFB700',
          },
        }
      }
    },
  },
  plugins: [tailwindGradients,
    //   function ({
    //   addBase,
    //   theme
    // }) {
    //   function extractColorVars(colorObj, colorGroup = '') {
    //     return Object.keys(colorObj).reduce((vars, colorKey) => {
    //       const value = colorObj[colorKey];
    //       const newVars =
    //         typeof value === 'string' ? {
    //           [`--color-video-${colorGroup}-${colorKey}`]: value
    //         } :
    //         extractColorVars(value, `-${colorKey}`);
    //       return {
    //         ...vars,
    //         ...newVars
    //       };
    //     }, {});
    //   }

    //   addBase({
    //     ':root': extractColorVars(theme('colors')),
    //   });
    // },
  ],
};
