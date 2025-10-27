import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 30000,
            '/webhook': {
                target: 'https://fetii.app.n8n.cloud',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/webhook/, '/webhook')
            }
        }
    }
)
