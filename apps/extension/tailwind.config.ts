import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./data/**/*.{ts,tsx}", "./styles/**/*.css"],
  theme: {
    extend: {
      colors: {
        calm: {
          50: "#f7faf7",
          100: "#e9f0e8",
          500: "#5f7f69",
          700: "#2f4937",
          900: "#1f2e24"
        }
      }
    }
  },
  plugins: []
}

export default config
