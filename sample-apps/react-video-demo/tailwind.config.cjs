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
    divideWidth: {
      default: '1px',
      DEFAULT: '1px',
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
      '3xs': '.5rem',
      '2xs': '.6rem',
      xs: '.75rem',
      tiny: '.8125rem',
      sm: '.875rem',
      // @TODO: Rename nav to something else and double-check its usage. Should nav be base?
      nav: '.9375rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.375rem', // h4
      '3xl': '1.875rem', // h3
      '4xl': '2.5rem', // h2
      '5xl': '3rem',
      '6xl': '4rem',
      tag: '10.4px',
    },
    colors: {
      white: '#fff',
      black: '#000',
      blue: {
        light: '#5DE0FF',
        lighter: '#304FFE',
        default: '#008AFF',
        DEFAULT: '#008AFF',
        dark: '#005EAD',
        darker: '#00225C',
      },
      error: '#ff5452',
      cyan: {
        light: '#00FFE1',
        normal: '#00DFFF',
        default: '#50E3C2',
        DEFAULT: '#50E3C2',
      },
      stream: {
        light: '#006CFF',
        default: '#005FFF',
        DEFAULT: '#005FFF',
        dark: '#0055e5',
        darker: '#004CCC',
      },
      lightblue: {
        light: '#E9F2FF',
        dark: 'rgba(0,108,255,0.19)',
        default: 'rgba(0,108,255,0.04)',
        DEFAULT: 'rgba(0,108,255,0.04)',
      },
      background: {
        default: '#FCFCFC',
        DEFAULT: '#FCFCFC',
        darker: '#FAFAFA',
      },
      grey: {
        lightest: '#F2F2F2',
        light: '#D9D9D9',
        default: '#BFBFBF',
        DEFAULT: '#BFBFBF',
        dark: '#7F7F7F',
        darker: '#212326',
        darkest: '#1B1C1F',
      },
      red: {
        lightest: '#f9f2f4',
        default: '#c7254e',
        DEFAULT: '#c7254e',
      },
      green: {
        light: 'rgba(80, 227, 194, 0.19)',
        default: '#10C29A',
        DEFAULT: '#10C29A',
      },
      transparent: 'transparent',
      code: {
        bg: '#141414',
        green: '#80EEB1',
        blue: '#81B0FF',
        purple: '#C586C0',
        lightblue: '#CAFFFF',
        pink: '#E987A5',
        text: '#FFFFFF',
        grey: '#D4D4D4'
      },
      map: {
        marker: {
          highlight: 'rgba(30, 177, 20, 0.2)',
          green: '#20E070',
          blue: '#2F7DEB',
        },
        popup:{
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

    maxHeight: {
      0: '0',
      '1/4': '25%',
      '1/2': '50%',
      '3/4': '75%',
      full: '100%',
    },

    extend: {
      screens: {
        xs: '320px',
        full: '1310px',
        container: '1200px',
      },
      height: {
        11: '2.75rem',
        13: '3.125rem',
        7: '1.875rem',
      },
      maxWidth: {
        container: '1170px',
        fuller: '1330px',
        wrapper: '1600px',
      },
      minWidth: {
        'button-s': '4rem',
        'button-m': '6rem',
        'button-l': '8rem',
      },
      padding: {
        'button-s': '15px 30px',
        'button-icon': '20px',
        navbar: '80px',
      },
      borderRadius: {
        tag: '2.4px',
        container: '8px',
        input: '6px',
        '4xl': '1.875rem',
      },
      gridTemplateRows: {
        demos: '90px 1fr 90px',
        'demos-mobile': '60px calc(100vh - 60px)',
        'demos-no-header': '1fr 45px',
      },
      lineHeight: {
        11: '3.375rem',
      },
      backgroundPosition: {
        'center-left': 'center left',
      },
      spacing: {
        7: '1.875rem',
        13: '3.25rem',
        14: '3.5rem',
        15: '3.75rem',
      },
      opacity: {
        15: '15%',
        20: '20%',
      },
      colors: {
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
      },
      letterSpacing: {
        stream: '1.86px',
      },
      inset: {
        navbar: 'var(--stream-navbar)',
        'navbar-1': 'calc(1rem + var(--stream-navbar))',
        'navbar-7': 'calc(1.875rem + var(--stream-navbar))',
      },
    },
  },

  plugins: [tailwindGradients],
};
