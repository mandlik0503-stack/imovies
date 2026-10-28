export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        prime: {
          dark: '#0f171e',
          surface: '#1a242f',
          card: '#253241',
          accent: '#00a8e1',
          'accent-hover': '#0891c9',
          muted: '#8197a4',
          secondary: '#c0cdd5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
