import {defineConfig} from 'vite';

const railwayHost = 'podarokdlyapt.up.railway.app';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: [railwayHost],
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: [railwayHost],
  },
});
