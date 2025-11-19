/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Merriweather"', 'serif'],
      },
      backgroundImage: {
        "chat-background": "url('/chat-bg.png')", // Assuming you still want this
      },
      colors: {
        // --- Ancient/Mystical Chat UI Palette ---
        "ancient-bg-dark": "#1e2024",
        "ancient-bg-medium": "#292b30",
        "ancient-border-stone": "#4b4f57",
        
        "ancient-text-light": "#e0e0e0",
        "ancient-text-muted": "#a0a0a0",
        
        // User message bubble (teal/greenish)
        "ancient-bubble-user": "#2A5C5A",         // Deep teal-green for sender bubbles
        "ancient-bubble-user-light": "#386a6a",   // Lighter shade for inner glow/effects if needed
        
        // Other user message bubble (earthy gold/brown)
        "ancient-bubble-other": "#7A5C2A",        // Earthy gold-brown for recipient bubbles
        "ancient-bubble-other-light": "#9A7D3A",  // Lighter shade for inner glow/effects if needed
        
        // Icon and interactive element green
        "ancient-icon-glow": "#4ade80",
        "ancient-icon-inactive": "#4D8F4D",       // Muted green for inactive icons
        
        // Warning/Error elements (red and gold)
        "ancient-warning-bg": "#8A3D3D",          // Deep muted red for warning background
        "ancient-warning-text": "#F9C4C4",        // Pale red/pink for warning text
        "ancient-error-bg": "#5F3C2A",            // Dark earthy orange/brown for error background (if distinct from warning)
        "ancient-error-text": "#F9E4C4",          // Pale orange/gold for error text
        
        // Input field
        "ancient-input-bg": "#33363d",
        "ancient-input-border": "#444850",
        
        // --- Legacy colors (retained for backward compatibility, adjust if new theme overrides) ---
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
        main: "auto 1fr",
      },
      animation: {
        blob: "blob 7s infinite",
        // Added custom pulse glow animation
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        // Added slow pulse animation
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
        // Slide/appear animations
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "zoom-in": "zoom-in 0.3s ease-out forwards",
        "zoom-in-fade-in": "zoom-in-fade-in 0.2s ease-out forwards",
        // New light pulse/spin/title animations
        "pulse-light": "pulse-light 4s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        // Additional effects for call UI
        "pulse-light-slow": "pulse-light-slow 6s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "spin-slow-reverse": "spin-slow-reverse 15s linear infinite",
        "float": "float 4s ease-in-out infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        // New slow floating animation
        "float-slow": "float-slow 6s ease-in-out infinite",
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
        // Added pulse-glow keyframes
        "pulse-glow": {
          "0%, 100%": {
            transform: "scale(1)",
            filter: "drop-shadow(0 0px 1px var(--tw-shadow-color))",
          },
          "50%": {
            transform: "scale(1.05)",
            filter: "drop-shadow(0 0px 3px var(--tw-shadow-color))",
          },
        },
        // Added pulse-slow keyframes
        "pulse-slow": {
          "0%, 100%": { opacity: 0.9, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.02)" },
        },
        // Slide/appear keyframes
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "zoom-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "zoom-in-fade-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // New keyframes
        "pulse-light": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.8", filter: "brightness(1.2)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Additional effects for call UI
        "pulse-light-slow": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.6", filter: "brightness(1.5)" },
        },
        "spin-slow-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        // Slow floating variant
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(-5px)" },
          "50%": { transform: "translateY(0)" },
          "75%": { transform: "translateY(-2px)" },
        },
      },
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('has-checked', '&:has(input:checked)');
    },
  ],
};