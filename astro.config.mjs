// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://bbtea.sg',
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      lastmod: new Date(),
      filter(page) {
        return ![
          'https://bbtea.sg/search/',
          'https://bbtea.sg/hello/',
        ].includes(page);
      },
      serialize(item) {
        if (item.url === 'https://bbtea.sg/') {
          return { ...item, changefreq: 'daily', priority: 1 };
        }

        const priorityBySection = [
          [/\/bubble-tea-shops\//, 0.85],
          [/\/brands\//, 0.75],
          [/\/malls\//, 0.7],
          [/\/towns\//, 0.7],
          [/\/stations\//, 0.65],
          [/\/drinks\//, 0.6],
          [/\/menus\//, 0.6],
        ];
        const match = priorityBySection.find(([pattern]) => pattern.test(item.url));
        return { ...item, priority: match ? match[1] : 0.5 };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
