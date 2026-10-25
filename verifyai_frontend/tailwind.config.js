/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We use default Tailwind palette with primary indigo and slate backgrounds
      },
    },
  },
  plugins: [],
}
