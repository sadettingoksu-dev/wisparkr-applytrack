import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          ...colors.purple,
          50: '#EEF0FF',
          600: '#6D5FD8',
        },
      },
    },
  },
  plugins: [],
}

export default config
