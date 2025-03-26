/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      height: {
        "screen/90": "90vh",
        "screen/85": "85vh",
      },
      width: {
        "screen/90": "90vw",
        "screen/80": "80vw",
        "screen/47": "47vw",
      },
      colors: {
        "miracle-dr-blue": "#0d416b",
        "miracle-blue": "#00aae7",
        "miracle-black": "#232527",
        "customGray": '#d9d9d9',
      },
    },
  },
  plugins: [],
};
