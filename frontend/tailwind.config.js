/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        fh: {
          blue: "#2F56D2",
          magenta: "#C23D9C",
          purple: "#7D39AC",
          bg: "#EEF4FF",
          panel1: "#F5F9FF",
          panel2: "#F0F5FF",
          border: "#D2D6E9",
          text900: "#0F172A",
          text600: "#3B4256",
          "blue-light": "#E8EFFF",
          "purple-light": "#F3ECFF",
          success: "#10B981",
          "success-light": "#D1FAE5",
          error: "#EF4444",
          "error-light": "#FEE2E2",
          warning: "#F59E0B",
          "warning-light": "#FEF3C7",
        },
      },
      borderRadius: {
        fhsm: "10px",
        fhmd: "14px",
        fhlg: "18px",
      },
      boxShadow: {
        fh: "0 10px 30px rgba(15, 23, 42, 0.06)",
        "fh-md": "0 4px 20px rgba(15, 23, 42, 0.08)",
        "fh-lg": "0 20px 50px rgba(15, 23, 42, 0.12)",
        "fh-xl": "0 30px 60px rgba(15, 23, 42, 0.15)",
        "fh-inner": "inset 0 2px 4px rgba(15, 23, 42, 0.06)",
      },
      backgroundImage: {
        "fh-hero":
          "linear-gradient(135deg, #C23D9C 0%, #7D39AC 40%, #2F56D2 100%)",
        "fh-subtle":
          "linear-gradient(135deg, rgba(194, 61, 156, 0.05) 0%, rgba(47, 86, 210, 0.05) 100%)",
        "fh-glow":
          "radial-gradient(circle at 50% 0%, rgba(47, 86, 210, 0.1) 0%, transparent 70%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in",
        "fade-up": "fadeUp 0.6s ease-out",
        "slide-in": "slideIn 0.5s ease-out",
        "pulse-subtle": "pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-gentle": "bounceGentle 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "sans-serif",
        ],
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
};
