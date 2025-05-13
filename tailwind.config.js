/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#8ecae6',
          hover: '#76b8da',
          dark: '#90e0ef',
          'dark-hover': '#72cfdc'
        },
        background: {
          light: '#fdfdfd',
          secondary: '#f0f4f8',
          editor: '#ffffff',
          dark: '#1e1e24',
          'dark-secondary': '#2b2d42',
          'dark-editor': '#252733'
        },
        text: {
          light: '#2f3e46',
          secondary: '#556872',
          muted: '#a1adb7',
          dark: '#e0f2f1',
          'dark-secondary': '#cdd9e5',
          'dark-muted': '#8896a5'
        },
        border: {
          light: '#dbe2ea',
          dark: '#3a3c53'
        }
      },
      boxShadow: {
        'light-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'light-md': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'dark-sm': '0 1px 2px rgba(255, 255, 255, 0.03)',
        'dark-md': '0 4px 6px -1px rgba(255, 255, 255, 0.05), 0 2px 4px -1px rgba(255, 255, 255, 0.04)'
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.text.light'),
            a: {
              color: theme('colors.primary.light'),
              '&:hover': {
                color: theme('colors.primary.hover'),
              },
            },
            h1: {
              color: theme('colors.text.light'),
            },
            h2: {
              color: theme('colors.text.light'),
            },
            h3: {
              color: theme('colors.text.light'),
            },
            h4: {
              color: theme('colors.text.light'),
            },
            code: {
              color: theme('colors.text.light'),
              backgroundColor: theme('colors.background.secondary'),
              padding: '0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: theme('colors.background.secondary'),
              color: theme('colors.text.light'),
              borderRadius: '0.375rem',
            },
            blockquote: {
              color: theme('colors.text.secondary'),
              borderLeftColor: theme('colors.primary.light'),
            },
          },
        },
        invert: {
          css: {
            color: theme('colors.text.dark'),
            a: {
              color: theme('colors.primary.dark'),
              '&:hover': {
                color: theme('colors.primary.dark-hover'),
              },
            },
            h1: {
              color: theme('colors.text.dark'),
            },
            h2: {
              color: theme('colors.text.dark'),
            },
            h3: {
              color: theme('colors.text.dark'),
            },
            h4: {
              color: theme('colors.text.dark'),
            },
            code: {
              color: theme('colors.text.dark'),
              backgroundColor: theme('colors.background.dark-secondary'),
            },
            pre: {
              backgroundColor: theme('colors.background.dark-secondary'),
              color: theme('colors.text.dark'),
            },
            blockquote: {
              color: theme('colors.text.dark-secondary'),
              borderLeftColor: theme('colors.primary.dark'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}