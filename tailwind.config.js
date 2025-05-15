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
          light: '#4cc9f0', // Brighter blue
          hover: '#4895ef', // Vibrant blue-purple
          dark: '#56cfe1', // Bright cyan
          'dark-hover': '#5e60ce' // Vibrant purple
        },
        accent: {
          light: '#f72585', // Vibrant pink
          hover: '#b5179e', // Deep magenta
          dark: '#ff6b6b', // Coral red
          'dark-hover': '#ff9e64' // Warm orange
        },
        background: {
          light: '#fdfdfd',
          secondary: '#f0f4f8',
          editor: '#ffffff',
          dark: '#1a1a2e', // Deeper blue-black
          'dark-secondary': '#16213e', // Deep navy
          'dark-editor': '#0f3460' // Rich blue
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
        },
        decoration: {
          light: '#ffd166', // Bright yellow
          secondary: '#06d6a0', // Mint green
          dark: '#7b2cbf', // Deep purple
          'dark-secondary': '#c77dff' // Lavender
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
              fontWeight: '600',
            },
            h2: {
              color: theme('colors.text.dark'),
              fontWeight: '600',
            },
            h3: {
              color: theme('colors.text.dark'),
              fontWeight: '600',
            },
            h4: {
              color: theme('colors.text.dark'),
              fontWeight: '600',
            },
            strong: {
              color: theme('colors.primary.dark'),
              fontWeight: '600',
            },
            code: {
              color: '#f48fb1',
              backgroundColor: 'rgba(244, 143, 177, 0.1)',
              borderRadius: '0.25rem',
              padding: '0.125rem 0.25rem',
              fontWeight: '500',
              border: '1px solid rgba(244, 143, 177, 0.2)',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#1e1e2f',
              color: theme('colors.text.dark'),
              borderRadius: '0.375rem',
              border: '1px solid #3a3c53',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: theme('colors.text.dark'),
              fontWeight: 'normal',
              border: 'none',
              padding: '0',
            },
            blockquote: {
              color: theme('colors.text.dark-secondary'),
              borderLeftColor: theme('colors.primary.dark'),
              backgroundColor: 'rgba(144, 224, 239, 0.05)',
            },
            hr: {
              borderColor: '#3a3c53',
            },
            'ol > li::marker': {
              color: theme('colors.primary.dark'),
              fontWeight: '600',
            },
            'ul > li::marker': {
              color: theme('colors.primary.dark'),
            },
            table: {
              borderColor: '#3a3c53',
            },
            th: {
              color: theme('colors.text.dark'),
              backgroundColor: '#252733',
              borderBottomColor: '#3a3c53',
            },
            td: {
              borderBottomColor: '#3a3c53',
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}