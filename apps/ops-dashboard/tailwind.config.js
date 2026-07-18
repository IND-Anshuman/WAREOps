/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A0F1E',
          900: '#0D1526',
          800: '#111827',
          700: '#1E293B',
        },
        surface: 'rgba(15, 23, 42, 0.8)',
        accent: {
          DEFAULT: '#3B82F6',
          dark: '#1D4ED8',
          glow: 'rgba(59, 130, 246, 0.3)',
        },
        success: {
          DEFAULT: '#10B981',
          glow: 'rgba(16, 185, 129, 0.3)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.3)',
        },
        danger: {
          DEFAULT: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.3)',
        },
        critical: {
          DEFAULT: '#DC2626',
          glow: 'rgba(220, 38, 38, 0.4)',
        },
        muted: '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      boxShadow: {
        glass: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        glow: '0 0 30px rgba(59,130,246,0.3)',
        'glow-success': '0 0 30px rgba(16,185,129,0.3)',
        'glow-danger': '0 0 30px rgba(239,68,68,0.3)',
        'glow-warning': '0 0 30px rgba(245,158,11,0.3)',
        card: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
        'scan-line': 'scan-line 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
