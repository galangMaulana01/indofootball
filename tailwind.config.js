/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors');

// Generate semua kombinasi warna + shade
const colorList = Object.keys(colors).filter(c => typeof colors[c] === 'object');
const shades = ['50','100','200','300','400','500','600','700','800','900','950'];
const utilities = ['text','bg','border','fill','stroke','from','to','via','ring','shadow','outline','accent','caret','decoration'];

const safelistPatterns = utilities.map(u => ({
  pattern: new RegExp(`^${u}-(${colorList.join('|')})-(${shades.join('|')})$`),
}));

const spacingValues = [...Array(97).keys()].map(String); // 0-96
const spacingUtils = ['w','h','min-w','min-h','max-w','max-h','p','m','px','py','pt','pb','pl','pr','mx','my','mt','mb','ml','mr','gap','space-x','space-y','top','bottom','left','right','inset'];

const safelistSpacing = spacingUtils.map(u => ({
  pattern: new RegExp(`^${u}-(${spacingValues.join('|')})$`),
}));

const textSizes = ['xs','sm','base','lg','xl','2xl','3xl','4xl','5xl','6xl','7xl','8xl','9xl'];
const fontWeights = ['thin','extralight','light','normal','medium','semibold','bold','extrabold','black'];
const roundedSizes = ['none','sm','','md','lg','xl','2xl','3xl','full'];

module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  safelist: [
    // Semua warna
    ...safelistPatterns,
    // Semua spacing
    ...safelistSpacing,
    // Text sizes
    ...textSizes.map(s => `text-${s}`),
    // Font weights
    ...fontWeights.map(w => `font-${w}`),
    // Rounded
    ...roundedSizes.map(r => r ? `rounded-${r}` : 'rounded'),
    // Opacity
    { pattern: /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)$/ },
    // Z-index
    { pattern: /^z-(0|10|20|30|40|50)$/ },
    // Flex
    'flex-1', 'flex-row', 'flex-col', 'flex-wrap',
    'items-center', 'items-start', 'items-end',
    'justify-center', 'justify-between', 'justify-start', 'justify-end',
    // Display
    'hidden', 'flex', 'absolute', 'relative', 'overflow-hidden', 'overflow-scroll',
    // Text align
    'text-center', 'text-left', 'text-right',
    // Static colors
    'text-white', 'text-black', 'bg-white', 'bg-black',
    'bg-transparent', 'border-transparent',
  ],
  theme: {
    extend: {
      colors: {
        culos: "#0C0D11",
        equd:"#010203",
      }
    }
  },
  plugins: [],
}
