/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mac: {
          bg: '#F5F5F7',
          card: '#FFFFFF',
          border: '#E5E5EA',
          borderSubtle: '#F2F2F7',
          blue: '#007AFF',
          blueHover: '#0062CC',
          blueLight: '#EBF5FF',
          blueTint: '#F0F6FF',
          textPrimary: '#1D1D1F',
          textSecondary: '#6E6E73',
          textTertiary: '#86868B',
          grayFill: '#EFEFF1'
        }
      },
      fontFamily: {
        sf: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'mac-card': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'mac-button': '0 1px 2px rgba(0, 122, 255, 0.2)',
        'mac-popover': '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
      }
    },
  },
  plugins: [],
}
