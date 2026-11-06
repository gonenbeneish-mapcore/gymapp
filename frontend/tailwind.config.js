/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        divider: "var(--divider)",
        ink: "var(--text)",
        "ink-2": "var(--text-2)",
        "ink-3": "var(--text-3)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "accent-text": "var(--accent-text)",
        "accent-soft": "var(--accent-soft)",
        record: "var(--record)",
        "record-text": "var(--record-text)",
        "record-soft": "var(--record-soft)",
      },
      fontFamily: {
        sans: ['"Inter Variable"', "-apple-system", "system-ui", "sans-serif"],
        display: ['"Space Grotesk Variable"', '"Inter Variable"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        panel: "20px",
        hero: "28px",
      },
      boxShadow: {
        float: "var(--shadow-float)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
        pop: {
          "0%": { transform: "scale(.6)" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
        flash: {
          from: { backgroundColor: "rgba(200,240,74,.28)" },
          to: { backgroundColor: "transparent" },
        },
        slideup: {
          from: { transform: "translateY(24px)", opacity: "0" },
          to: { transform: "none", opacity: "1" },
        },
        sheet: {
          from: { transform: "translateY(100%)" },
          to: { transform: "none" },
        },
        fade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        restpulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,159,67,.6)" },
          "50%": { boxShadow: "0 0 0 12px rgba(255,159,67,0)" },
        },
      },
      animation: {
        rise: "rise .45s cubic-bezier(.2,.8,.2,1) both",
        pop: "pop .32s cubic-bezier(.2,.8,.2,1)",
        flash: "flash .7s ease-out",
        slideup: "slideup .35s cubic-bezier(.2,.8,.2,1)",
        sheet: "sheet .32s cubic-bezier(.2,.8,.2,1)",
        fade: "fade .2s ease-out",
        restpulse: "restpulse 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
