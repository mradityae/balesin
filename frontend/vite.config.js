import { defineConfig } from "vite";

export default defineConfig({
  server: {
    allowedHosts: [".trycloudflare.com"],
  },
});


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
