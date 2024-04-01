import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        'main-orange': '#E24E1B',
        'orange-2': '#EA7148',
      },
    },
  },
  plugins: [],
} satisfies Config;
