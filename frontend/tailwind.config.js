/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ng-rail':       '#0A0E0C',
        'ng-bg':         '#0E1311',
        'ng-panel':      '#121915',
        'ng-hover':      '#1E2723',
        'ng-border':     '#232E29',
        'ng-text':       '#E9EDE6',
        'ng-muted':      '#8A968F',
        'ng-accent':     '#E8A33D',
        'ng-accent-fg':  '#16110A',
        'ng-online':     '#7FC29B',
        'ng-terracotta': '#C9743E',
        'ng-sage':       '#7FA38F',
        'ng-teal':       '#6E9AA6',
      },
      fontFamily: {
        heading: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        btn:  '14px',
        row:  '16px',
        card: '20px',
        tile: '28px',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        'night-garden': {
          'primary':         '#E8A33D',
          'primary-content': '#16110A',
          'secondary':       '#7FA38F',
          'accent':          '#6E9AA6',
          'neutral':         '#232E29',
          'base-100':        '#0E1311',
          'base-200':        '#121915',
          'base-300':        '#1E2723',
          'base-content':    '#E9EDE6',
          'success':         '#7FC29B',
          'warning':         '#E8A33D',
          'error':           '#C9743E',
          'info':            '#6E9AA6',
        },
      },
    ],
    defaultTheme: 'night-garden',
    darkTheme:    'night-garden',
  },
}