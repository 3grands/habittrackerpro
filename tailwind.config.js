// tailwind.config.js
const typography = require('@tailwindcss/typography')

module.exports = {
  content: [
    './index.html',
    './client/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { extend: {} },
  plugins: [typography],
}
