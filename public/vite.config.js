// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        // Explicitly telling Vite how to handle dependencies
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                }
            }
        }
    },
    resolve: {
        // Add aliases if needed
        alias: {
            // You can add aliases here if necessary
        }
    }
})