/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── Aegis V3.0 Surface System ── */
        "surface":                  "#0c1324",
        "surface-dim":              "#0c1324",
        "surface-bright":           "#33394c",
        "surface-container-lowest": "#070d1f",
        "surface-container-low":    "#151b2d",
        "surface-container":        "#191f31",
        "surface-container-high":   "#23293c",
        "surface-container-highest":"#2e3447",

        /* ── On-Surface (Text) ── */
        "on-surface":               "#dce1fb",
        "on-surface-variant":       "#bbc9cd",
        "inverse-surface":          "#dce1fb",
        "inverse-on-surface":       "#2a3043",

        /* ── Primary (Cyan — AI Active Signal) ── */
        "primary":                  "#22d3ee",
        "primary-dim":              "#2fd9f4",
        "primary-bright":           "#8aebff",
        "on-primary":               "#00363e",
        "primary-container":        "#22d3ee",

        /* ── Secondary (Emerald — Positive Signal) ── */
        "secondary":                "#45dfa4",
        "on-secondary":             "#003825",
        "secondary-container":      "#00bd85",

        /* ── Tertiary (Rose — Alert/Anomaly) ── */
        "tertiary":                 "#ffd2d5",
        "tertiary-container":       "#ffaab2",
        "on-tertiary":              "#67001f",

        /* ── Error ── */
        "error":                    "#ffb4ab",
        "on-error":                 "#690005",
        "error-container":          "#93000a",

        /* ── Outline / Borders ── */
        "outline":                  "#859397",
        "outline-variant":          "#3c494c",

        /* ── Surface Tint ── */
        "surface-tint":             "#2fd9f4",
      },

      fontFamily: {
        "sans":       ["Geist", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        "geist":      ["Geist", "sans-serif"],
        "mono":       ["JetBrains Mono", "Fira Code", "monospace"],
        "data-mono":  ["JetBrains Mono", "monospace"],
      },

      fontSize: {
        "display-lg":       ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg":      ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg-mob":  ["24px", { lineHeight: "1.2", fontWeight: "600" }],
        "headline-md":      ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "title-md":         ["18px", { lineHeight: "1.4", fontWeight: "500" }],
        "body-lg":          ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md":          ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "data-mono":        ["13px", { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "500" }],
        "label-sm":         ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
      },

      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg":      "0.75rem",
        "xl":      "1rem",
        "2xl":     "1.5rem",
        "full":    "9999px",
      },

      spacing: {
        "unit":           "4px",
        "gutter":         "16px",
        "margin-desktop": "32px",
        "margin-mobile":  "16px",
        "sidebar":        "256px",
      },

      animation: {
        "shimmer":       "shimmer 1.5s infinite",
        "signal-pulse":  "signal-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ticker-scroll": "ticker-scroll 25s linear infinite",
      },

      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "100% 0" },
          "100%": { backgroundPosition: "-100% 0" },
        },
        "signal-pulse": {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        "ticker-scroll": {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
}
