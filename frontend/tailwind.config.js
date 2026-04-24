/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        glow: "0 0 25px rgba(16, 185, 129, 0.35)",
        soft: "0 12px 30px rgba(15, 23, 42, 0.45)"
      }
    }
  },
  plugins: []
};
