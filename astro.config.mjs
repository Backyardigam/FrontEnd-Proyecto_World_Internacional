// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site:'https://front-end-proyecto-wor-git-ceef90-benjaminpari1478557s-projects.vercel.app',
  output: 'static', //server
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel({
    isr:{
      expiration: 60 * 60,
    }
  })
});