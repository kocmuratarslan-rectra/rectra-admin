import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rectra: {
          red: "#B3122A",
          dark: "#1A1A1A",
          gray: "#F5F5F6",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
