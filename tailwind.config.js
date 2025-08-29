/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Add Inter to sans-serif stack
      },
      colors: {
        'sidebar': '#2d2d2d', // Assuming secondary-bg
        'sidebar-border': '#4a4a4a', // Assuming border-color
        'sidebar-foreground': '#d4d4d4', // Assuming primary-text
        'sidebar-accent': '#3c3c3c', // Assuming tertiary-bg for accent
        'chat-ai-bg': '#3c3c3c', // Assuming tertiary-bg
        'chat-ai-fg': '#d4d4d4', // Assuming primary-text
        'muted': '#4a4a4a', // Assuming a muted background
        'muted-foreground': '#a0a0a0', // Assuming a muted foreground
        'primary-foreground': 'var(--primary-text)', // Map to existing CSS variable
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #007acc, #009eff)', // Simple gradient
      },
      boxShadow: {
        'elegant': '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)', // Placeholder
        'glow': '0 0 15px rgba(0, 122, 204, 0.6)', // Placeholder for accent-color glow
        'soft': '0 2px 4px rgba(0, 0, 0, 0.06)', // Placeholder
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(.17,.67,.83,.67)', // Placeholder for transition-spring
      },
    },
  },
  plugins: [function ({ addComponents, theme }) {
    addComponents({
      '.chat-input-field': {
        '@apply p-2 rounded-lg focus:ring-2 focus:ring-primary focus:ring-offset-2 font-sans': {},
      },
    });
  }],
}