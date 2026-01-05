/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],

  theme: {
  extend: {
    colors: {
      medical: {
        primary: "#1E3A8A",
        light: "#3B82F6",
        bg: "#F8FAFC",
        card: "#F1F5F9",
        border: "#E2E8F0",
      },
      prediction: {
        clinical: "#E11D48",
        xray: "#16A34A",
        sensor: "#F59E0B",
        fusion: "#4F46E5",
      },
      status: {
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#DC2626",
        info: "#0EA5E9",
      },
    },
  },
},

}

