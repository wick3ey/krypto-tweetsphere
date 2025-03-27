
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Define environment variables to be exposed to the client
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://dtrlmfwgtjrjkepvgatv.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cmxtZndndGpyamtlcHZnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNDM3NjUsImV4cCI6MjA1ODYxOTc2NX0.6nB2HwLdPQynPYowwoHVF17wG8G85sGXcu79AsOJe9g'),
    },
    server: {
      port: 8080
    }
  };
});
