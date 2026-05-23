import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e8f0fb',
                    100: '#c5d8f5',
                    200: '#9dbfee',
                    300: '#74a6e7',
                    400: '#4d8ee2',
                    500: '#1a4f8a',
                    600: '#164479',
                    700: '#123968',
                    800: '#0e2d57',
                    900: '#0a2245',
                },
                success: { DEFAULT: '#0F6E56', light: '#E1F5EE', dark: '#085041' },
                warning: { DEFAULT: '#BA7517', light: '#FAEEDA', dark: '#854F0B' },
                danger: { DEFAULT: '#993C1D', light: '#FAECE7', dark: '#712B13' },
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
            },
            screens: {
                xs: '390px',
            },
        },
    },
    plugins: [],
}
export default config