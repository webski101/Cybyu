import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./web/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      },
      colors: {
        ink: {
          900: "#0b1020",
          800: "#11182a",
          700: "#1a2238"
        },
        accent: {
          500: "#6ad7ff",
          600: "#39b8e6"
        },
        good: "#34d399",
        bad: "#f87171"
      }
    }
  },
  plugins: []
};

export default config;