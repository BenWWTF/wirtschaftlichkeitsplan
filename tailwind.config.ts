import type { Config } from 'tailwindcss'

const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          '"Spline Sans Mono"',
          '"SF Mono"',
          'Monaco',
          'Inconsolata',
          'Fira Code',
          'Courier New',
          'monospace'
        ]
      },
      colors: {
        // Taubenblau accent - sophisticated dusty blue-gray
        accent: {
          50: '#F0F3F6',
          100: '#E1E8F0',
          200: '#C3D1E0',
          300: '#A8C5D1',
          400: '#8AB5C4',
          500: '#7A9BA8',
          600: '#6A8B98',
          700: '#5A7B88',
          800: '#4A6B78',
          900: '#3A5B68',
          DEFAULT: '#7A9BA8'
        },
        primary: {
          50: '#EFF6FF',
          100: '#E0EDFF',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C3A66',
          DEFAULT: '#0284C7'
        },
        neutral: {
          50: '#F7F7F7',
          100: '#F1F1F1',
          200: '#D0D0D0',
          300: '#AAAAAA',
          400: '#606060',
          500: '#404040',
          600: '#303030',
          700: '#101010',
          800: '#0E0E0E',
          900: '#000000'
        },
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        background: 'hsl(var(--background, 0 0% 100%))',
        foreground: 'hsl(var(--foreground, 0 0% 3.6%))',
        card: 'hsl(var(--card, 0 0% 100%))',
        'card-foreground': 'hsl(var(--card-foreground, 0 0% 3.6%))',
        muted: 'hsl(var(--muted, 0 0% 96%))',
        'muted-foreground': 'hsl(var(--muted-foreground, 0 0% 45%))',
        ring: 'hsl(var(--ring, 0 0% 3.6%))',
        border: 'hsl(var(--border, 0 0% 89%))',
        input: 'hsl(var(--input, 0 0% 89%))',
      },
      spacing: {
        '4.5': '1.125rem',
        '8.5': '2.125rem',
        '13': '3.25rem',
        '14': '3.5rem',
        '18': '4.5rem',
        '22': '5.5rem',
        // Mobile bottom nav safe area spacing
        'safe-bottom': 'calc(64px + env(safe-area-inset-bottom))',
        'touch-min': '44px',
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        md: '4px',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-down': 'fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slideInLeft 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slideInRight 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'glow': 'glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        fadeInUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        fadeInDown: {
          'from': {
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        slideInLeft: {
          'from': {
            opacity: '0',
            transform: 'translateX(-40px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        slideInRight: {
          'from': {
            opacity: '0',
            transform: 'translateX(40px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        scaleIn: {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)'
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)'
          }
        },
        glow: {
          '0%': {
            boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)'
          },
          '50%': {
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)'
          },
          '100%': {
            boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)'
          }
        }
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.11, 0.82, 0.39, 0.92)',
        'ease-in': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
        'ease-out': 'cubic-bezier(0.22, 0.61, 0.36, 1)'
      },
      fontSize: {
        // Mobile typography scale
        'mobile-h1': ['24px', { lineHeight: '1.3' }],
        'mobile-h2': ['20px', { lineHeight: '1.3' }],
        'mobile-h3': ['18px', { lineHeight: '1.3' }],
      }
    }
  },
  plugins: []
} satisfies Config

export default config
