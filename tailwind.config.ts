import type { Config } from 'tailwindcss'

const config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        base: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      colors: {
        // Wirtschaftlichkeitsplan design tokens
        'wb-black': '#000000',
        'wb-charcoal': '#101010',
        'wb-dark-gray': '#606060',
        'wb-medium-gray': '#AAAAAA',
        'wb-silver': '#D0D0D0',
        'wb-light-gray': '#F1F1F1',
        'wb-pale-gray': '#F7F7F7',
        'wb-white': '#FFFFFF',
        'wb-accent-primary': '#7A9BA8',
        'wb-accent-light': '#A8C5D1',
        'wb-accent-dark': '#5A7B88',
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
          // Taubenblau palette for primary color
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
          900: '#000000',
          950: '#0A0A0A'
        },
        // Semantic financial colors
        profit: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#145231',
          950: '#0B5314',
          DEFAULT: '#22C55E'
        },
        loss: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#5F0F0F',
          DEFAULT: '#EF4444'
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#54270B',
          DEFAULT: '#F59E0B'
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          900: '#145231',
          DEFAULT: '#22C55E'
        },
        info: {
          50: '#EFF6FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#072E4E',
          DEFAULT: '#0EA5E9'
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
        // Mobile-specific spacing
        'mobile-xs': '0.5rem',  // 8px - small gaps
        'mobile-sm': '0.75rem', // 12px - standard mobile gap
        'mobile-md': '1rem',    // 16px - default spacing
        'mobile-lg': '1.5rem',  // 24px - large spacing
        'mobile-xl': '2rem',    // 32px - extra large
        'card-gap': '0.75rem',  // Gap between cards
        'list-item-height': '3.5rem', // Min height for list items
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
        'glow': 'glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-gentle': 'pulseGentle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite'
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
        },
        shimmer: {
          '0%': {
            transform: 'translateX(-100%)'
          },
          '100%': {
            transform: 'translateX(100%)'
          }
        },
        pulseGentle: {
          '0%, 100%': {
            opacity: '1'
          },
          '50%': {
            opacity: '0.8'
          }
        },
        bounceSubtle: {
          '0%, 100%': {
            transform: 'translateY(0)'
          },
          '50%': {
            transform: 'translateY(-4px)'
          }
        }
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.11, 0.82, 0.39, 0.92)',
        'ease-in': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
        'ease-out': 'cubic-bezier(0.22, 0.61, 0.36, 1)'
      },
      fontSize: {
        // Mobile typography scale - Headings
        'mobile-h1': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'mobile-h2': ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        'mobile-h3': ['18px', { lineHeight: '1.3', fontWeight: '600' }],
        'mobile-h4': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        // Mobile typography scale - Body
        'mobile-body-lg': ['16px', { lineHeight: '1.6' }],  // Default body text
        'mobile-body': ['14px', { lineHeight: '1.6' }],     // Standard text
        'mobile-body-sm': ['13px', { lineHeight: '1.5' }],  // Small text
        'mobile-caption': ['12px', { lineHeight: '1.4' }],  // Extra small
        // Desktop typography remains via default Tailwind
      },
    }
  },
  plugins: []
} satisfies Config

export default config
