/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "brand-navy": "#1A3A5C",
        "brand-orange": "#EA580C",
        "brand-orange-light": "#FF7E33",
        "brand-slate": {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          900: "#0f172a",
        }
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
      },
      boxShadow: {
        premium: "0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      }
    },
  },
  plugins: [],
};
