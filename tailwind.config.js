/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class"], // Force class-based dark mode only (not media query)
  theme: {
    extend: {
      colors: {
        // Dyson Sphere Program SF Theme Colors
        primary: {
          50: "#e0f2ff",
          100: "#b3e0ff",
          200: "#80ccff",
          300: "#4db8ff",
          400: "#1aa3ff",
          500: "#0088ff", // Bright cyan-blue (energy core)
          600: "#0070e6",
          700: "#0058cc",
          800: "#0040b3",
          900: "#002899",
        },
        neon: {
          cyan: "#7db7d8",
          blue: "#5d93c4",
          purple: "#8f82b8",
          magenta: "#b07aa3",
          orange: "#c08457",
          yellow: "#c8ad63",
          green: "#7fb58c",
        },
        space: {
          50: "#e8ecf1",
          100: "#c5cdd8",
          200: "#9fabbd",
          300: "#7989a2",
          400: "#5d6f8e",
          500: "#41557a", // Medium space blue
          600: "#3a4d72",
          700: "#314267",
          800: "#28385d",
          900: "#192746", // Deep space
        },
        dark: {
          100: "#1e293b",
          200: "#1a2332",
          300: "#151d2a",
          400: "#111827",
          500: "#0d1117",
          600: "#0a0e14",
          700: "#070a10",
          800: "#05070c",
          900: "#020308", // Almost black (deep space)
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(0, 136, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 136, 255, 0.1) 1px, transparent 1px)",
        "energy-glow":
          "radial-gradient(circle at center, rgba(0, 136, 255, 0.15), transparent 70%)",
        "space-gradient": "linear-gradient(135deg, #0d1117 0%, #192746 50%, #0d1117 100%)",
        "nebula-gradient":
          "radial-gradient(ellipse at top, rgba(168, 85, 247, 0.15), transparent 50%), radial-gradient(ellipse at bottom, rgba(0, 136, 255, 0.15), transparent 50%)",
      },
      boxShadow: {
        "neon-blue": "none",
        "neon-cyan": "none",
        "neon-purple": "none",
        "neon-magenta": "none",
        energy: "0 12px 32px rgba(0, 0, 0, 0.28)",
        panel: "0 12px 36px rgba(0, 0, 0, 0.28)",
      },
      borderColor: {
        "neon-blue": "rgba(125, 151, 178, 0.42)",
        "neon-cyan": "rgba(125, 183, 216, 0.42)",
        "neon-purple": "rgba(143, 130, 184, 0.42)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        scan: "scan 3s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": {
            boxShadow: "none",
          },
          "100%": {
            boxShadow: "none",
          },
        },
        scan: {
          "0%": {
            backgroundPosition: "0% 0%",
          },
          "100%": {
            backgroundPosition: "0% 100%",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
      },
      gridTemplateColumns: {
        14: "repeat(14, minmax(0, 1fr))",
      },
      gridTemplateRows: {
        8: "repeat(8, minmax(0, 1fr))",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
