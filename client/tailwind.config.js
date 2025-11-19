/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "chat-background": "url('/chat-bg.png')",
      },
      colors: {
        // Dark Mode Ghost UI palette colors
        "bg-main": "#0B141A",               // Deep Dark (main background)
        "bg-secondary": "#1F2C34",          // Dark Grey-Blue (cards, panels)
        "user-bubble": "#005C4B",           // Dark Teal (user chat bubbles)
        "other-bubble": "#202C33",          // Dark Grey (others' bubbles)
        "icon-active": "#00A884",           // Bright Teal (icons, accents)
        "text-primary": "#E9EDEF",          // Crisp White (primary text)
        "text-secondary": "#8696A0",        // Muted Grey (timestamps, secondary)
        error: "#C79292",                   // Desaturated Rose (error)
        warning: "#E0D0B8",                 // Soft Pale Gold (warning)
        
        // Additional dark mode colors
        "bg-hover": "#2A3942",              // Hover states
        "border-dark": "#2A3942",           // Borders
        "border-hover": "#374954",          // Border hover
        
        // Legacy colors remain untouched for backward compatibility
        secondary: "#8696a0",
        "teal-light": "#7ae3c3",
        "photopicker-overlay-background": "rgba(30,42,49,0.8)",
        "dropdown-background": "#233138",
        "dropdown-background-hover": "#182229",
        "input-background": " #2a3942",
        "primary-strong": "#e9edef",
        "panel-header-background": "#202c33",
        "panel-header-icon": "#aebac1",
        "icon-lighter": "#8696a0",
        "icon-green": "#00a884",
        "search-input-container-background": "#111b21",
        "conversation-border": "rgba(134,150,160,0.15)",
        "conversation-panel-background": "#0b141a",
        "background-default-hover": "#202c33",
        "incoming-background": "#202c33",
        "outgoing-background": "#005c4b",
        "bubble-meta": "hsla(0,0%,100%,0.6)",
        "icon-ack": "#53bdeb",
      },
      gridTemplateColumns: {
        main: "1fr 2.4fr",
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
};