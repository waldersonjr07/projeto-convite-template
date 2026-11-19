/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain: 'var(--bg-main)',
        surface: 'var(--surface)',
        surfaceElevated: 'var(--surface-elevated)',
        textPrimary: 'var(--text-primary)',
        textMuted: 'var(--text-muted)',
        accent: 'var(--accent)',
        accentInk: 'var(--accent-ink)',
        sage: 'var(--sage)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        solid: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
