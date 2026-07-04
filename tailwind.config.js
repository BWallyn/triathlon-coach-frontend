/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          mid: '#5DCAA5',
        },
        violet: {
          DEFAULT: '#7F77DD',
          light: '#EEEDFE',
          mid: '#AFA9EC',
        },
        amber: {
          sport: '#BA7517',
          light: '#FAEEDA',
          mid: '#EF9F27',
        },
        ocean: {
          DEFAULT: '#185FA5',
          light: '#E6F1FB',
          mid: '#85B7EB',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '11px',
        sm: '7px',
      },
    },
  },
  plugins: [],
}
