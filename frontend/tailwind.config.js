/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        fh: {
          blue: '#2F56D2',
          magenta: '#C23D9C',
          purple: '#7D39AC',
          bg: '#EEF4FF',
          panel1: '#F5F9FF',
          panel2: '#F0F5FF',
          border: '#D2D6E9',
          text900: '#0F172A',
          text600: '#3B4256'
        }
      },
      borderRadius: {
        fhsm: '10px',
        fhmd: '14px',
        fhlg: '18px'
      },
      boxShadow: {
        fh: '0 10px 30px rgba(15, 23, 42, 0.06)'
      },
      backgroundImage: {
        'fh-hero': 'linear-gradient(135deg, #C23D9C 0%, #7D39AC 40%, #2F56D2 100%)'
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
};

