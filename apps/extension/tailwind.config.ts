import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./popup.tsx", "./options.tsx"],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f2ec",
        ink: "#1d2a2f",
        accent: "#0f766e"
      }
    }
  },
  plugins: []
}

export default config
