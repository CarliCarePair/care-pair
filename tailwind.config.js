/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#F9F4EF",
          card: "#FFFFFF",
          plum: "#8B4F6B",
          "plum-dark": "#6E3A54",
          "plum-light": "#B07090",
          "plum-pale": "#F3EBF0",
          gold: "#D4922A",
          "gold-pale": "#FDF3E3",
          "gold-line": "#E8C88A",
          ink: "#1C1A2E",
          muted: "#9B8FA0",
          line: "#EDE8EA",
          soft: "#FBF9F6",
          green: "#4A9E6F",
          "green-pale": "#EDFAF3",
          red: "#B0473F",
          "red-pale": "#FBEFEE",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
