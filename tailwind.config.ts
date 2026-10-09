import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Section 3: Deep Navy #0B1F33
        navy: {
          50: "#F0F5FA",
          100: "#E1EBF5",
          200: "#BFD3EB",
          300: "#8FB4DC",
          400: "#5A94CB",
          500: "#3A7BB8",
          600: "#2A6198",
          700: "#1E4974",
          800: "#143454",
          850: "#0F263D",
          900: "#0B1F33", // Primary Deep Navy
          950: "#061320",
        },
        // Section 3: Textile Gold #C89B3C
        gold: {
          50: "#FCF8EE",
          100: "#F8EDD3",
          200: "#F1DAA4",
          300: "#E5C478",
          400: "#D7AE52",
          500: "#C89B3C", // Secondary Textile Gold
          600: "#A9802B",
          700: "#8A671B",
          800: "#644A14",
          900: "#3D2D0C",
        },
        // Section 3: Warm White #F7F5F0 & Surfaces
        warm: {
          50: "#FFFFFF",
          100: "#FAF8F5",
          200: "#F7F5F0", // Brand Background
          300: "#EFECE4",
          400: "#E4DFD3",
          500: "#D5CEC0",
        },
        // Section 3: Primary Text #17202A & Secondary Text #64748B
        charcoal: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B", // Secondary Text
          600: "#475569",
          700: "#334155",
          800: "#243242",
          900: "#17202A", // Primary Text
          950: "#0D131A",
        },
        // Functional States
        app: {
          success: "#15803D",
          warning: "#D97706",
          danger: "#DC2626",
        },
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        slate: {
          850: "#172033",
          900: "#0f172a",
          950: "#080d1a",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(11, 31, 51, 0.05)",
        card: "0 1px 3px 0 rgba(11, 31, 51, 0.08), 0 1px 2px -1px rgba(11, 31, 51, 0.05)",
        elevated: "0 4px 16px -2px rgba(11, 31, 51, 0.08), 0 2px 6px -2px rgba(11, 31, 51, 0.04)",
        modal: "0 12px 32px -4px rgba(11, 31, 51, 0.16), 0 4px 12px -2px rgba(11, 31, 51, 0.08)",
      },
      borderRadius: {
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
