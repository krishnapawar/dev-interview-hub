import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages project URL: username.github.io/dev-interview-prep/
  base: '/dev-interview-prep/',
  plugins: [react(), tailwindcss()],
})