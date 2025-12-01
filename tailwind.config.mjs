/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				'rojo-f': 'var(--color-rojo-f)',
				'naranja-c': 'var(--color-naranja-c)',
				'naranja-f': 'var(--color-naranja-f)',
				'azul-c': 'var(--color-azul-c)',
			},
			fontFamily: {
				redhat: ['RedHatDisplay', 'system-ui', 'sans-serif'],
				baloo: ['Baloo'],
			}
		},
	},
	plugins: [],
}