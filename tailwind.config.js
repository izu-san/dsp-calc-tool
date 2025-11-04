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
          cyan: "#00d9ff", // Electric cyan
          blue: "#0088ff", // Energy blue
          purple: "#a855f7", // Warp purple
          magenta: "#e935ff", // Plasma magenta
          orange: "#ff6b35", // Energy orange
          yellow: "#ffd700", // Power yellow
          green: "#00ff88", // Matrix green
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
        "neon-blue": "0 0 10px rgba(0, 136, 255, 0.5), 0 0 20px rgba(0, 136, 255, 0.3)",
        "neon-cyan": "0 0 10px rgba(0, 217, 255, 0.5), 0 0 20px rgba(0, 217, 255, 0.3)",
        "neon-purple": "0 0 10px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)",
        "neon-magenta": "0 0 10px rgba(233, 53, 255, 0.5), 0 0 20px rgba(233, 53, 255, 0.3)",
        energy:
          "0 0 15px rgba(0, 136, 255, 0.4), 0 0 30px rgba(0, 136, 255, 0.2), inset 0 0 10px rgba(0, 136, 255, 0.1)",
        panel: "0 4px 20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 136, 255, 0.1)",
      },
      borderColor: {
        "neon-blue": "rgba(0, 136, 255, 0.5)",
        "neon-cyan": "rgba(0, 217, 255, 0.5)",
        "neon-purple": "rgba(168, 85, 247, 0.5)",
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
            boxShadow: "0 0 5px rgba(0, 136, 255, 0.5), 0 0 10px rgba(0, 136, 255, 0.3)",
          },
          "100%": {
            boxShadow:
              "0 0 10px rgba(0, 136, 255, 0.8), 0 0 20px rgba(0, 136, 255, 0.5), 0 0 30px rgba(0, 136, 255, 0.3)",
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
