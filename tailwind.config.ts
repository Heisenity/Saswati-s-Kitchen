import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFF8EF",
        foreground: "#232323",
        border: "#E8D9C7",
        primary: "#B51E1E",
        mustard: "#E7B63E",
        leaf: "#1E8E52",
        muted: "#F5EBDD",
        card: "#FFFDF8"
      },
      fontFamily: {
        serif: [
          "\"Iowan Old Style\"",
          "\"Palatino Linotype\"",
          "\"Book Antiqua\"",
          "Palatino",
          "Georgia",
          "serif"
        ],
        sans: [
          "\"Avenir Next\"",
          "\"Segoe UI\"",
          "\"Helvetica Neue\"",
          "sans-serif"
        ]
      },
      boxShadow: {
        warm: "0 18px 48px rgba(120, 42, 18, 0.12)"
      },
      backgroundImage: {
        "hero-wash":
          "radial-gradient(circle at top left, rgba(231, 182, 62, 0.22), transparent 42%), radial-gradient(circle at bottom right, rgba(181, 30, 30, 0.1), transparent 38%)"
      }
    }
  },
  plugins: []
};

export default config;
