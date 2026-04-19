import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tulane: {
          green: '#006747',
          blue: '#7DB7E8',
          white: '#FFFFFF'
        }
      },
      fontFamily: {
        serif: ['Times New Roman', 'Times', 'serif']
      }
    }
  },
  plugins: []
};

export default config;
