/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Navy Blue Palette
        navy: {
          950: '#0a0f1a',
          900: '#0d1525',
          850: '#111b2e',
          800: '#152238',
          700: '#1e3a5f',
          600: '#2563eb',
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd',
        },
        // Gold Accent Palette
        gold: {
          700: '#9a7b24',
          600: '#b8962e',
          500: '#d4af37',
          400: '#e6c358',
          300: '#f0d77a',
          200: '#f7e8a8',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'reveal-up': 'revealUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'reveal-down': 'revealDown 0.7s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'reveal-left': 'revealLeft 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'reveal-right': 'revealRight 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'reveal-scale': 'revealScale 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'dramatic': 'dramaticEntrance 1s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'slide-bounce': 'slideInBounce 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'flip-in': 'flipIn 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'zoom-rotate': 'zoomRotate 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'elastic': 'elasticPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer-gold 2s infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
      },
      keyframes: {
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(60px) scale(0.95)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        revealDown: {
          '0%': { opacity: '0', transform: 'translateY(-40px)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        revealLeft: {
          '0%': { opacity: '0', transform: 'translateX(-80px) rotate(-2deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0)' },
        },
        revealRight: {
          '0%': { opacity: '0', transform: 'translateX(80px) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0)' },
        },
        revealScale: {
          '0%': { opacity: '0', transform: 'scale(0.8) rotateX(10deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateX(0)' },
        },
        dramaticEntrance: {
          '0%': { opacity: '0', transform: 'translateY(100px) scale(0.5)', filter: 'blur(20px)' },
          '50%': { filter: 'blur(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        slideInBounce: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '60%': { transform: 'translateX(10%)' },
          '80%': { transform: 'translateX(-5%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        flipIn: {
          '0%': { opacity: '0', transform: 'perspective(400px) rotateY(90deg)' },
          '100%': { opacity: '1', transform: 'perspective(400px) rotateY(0)' },
        },
        zoomRotate: {
          '0%': { opacity: '0', transform: 'scale(0) rotate(-180deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        elasticPop: {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '55%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-20px) rotate(1deg)' },
          '75%': { transform: 'translateY(10px) rotate(-1deg)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.3)' },
        },
        'shimmer-gold': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        'rotate-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      boxShadow: {
        'gold': '0 4px 20px -4px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 8px 30px -4px rgba(212, 175, 55, 0.4)',
        'navy': '0 4px 20px -4px rgba(30, 58, 95, 0.5)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #9a7b24 100%)',
        'gradient-navy': 'linear-gradient(135deg, #1e3a5f 0%, #0d1525 100%)',
      },
    },
  },
  plugins: [],
}
