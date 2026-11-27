import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
export default defineConfig({plugins: [legacy({targets: ['Chrome >= 38'], modernTargets: ['Chrome >= 64']})]})
