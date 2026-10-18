// import { defineConfig } from 'vite'

// const api = { '/api': { target: 'http://gof.zzb.cx', changeOrigin: true, secure: true, } }
// export default defineConfig({
//   base: './',
//   server: { proxy: api },
//   preview: { proxy: api },
// })

import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'https://gof.zzb.cx',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'https://gof.zzb.cx',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})