// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

import sitemap from '@astrojs/sitemap';


// https://astro.build/config
export default defineConfig({
  site:'https://front-end-proyecto-wor-git-ceef90-benjaminpari1478557s-projects.vercel.app',
  output: 'static', //server
  integrations: [
    react(), 
    sitemap({
      filter: (page) => page !== 'https://front-end-proyecto-wor-git-ceef90-benjaminpari1478557s-projects.vercel.app/core-tacana-wits-7b345',
    }),
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  // adapter: vercel({
  //   isr:{
  //     expiration: 60 * 60,
  //   }
  // })
});