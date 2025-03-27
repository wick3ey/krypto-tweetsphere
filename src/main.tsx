
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

// Get the root element
const rootElement = document.getElementById("root");

// Ensure the root element exists before attempting to render
if (rootElement) {
  const root = createRoot(rootElement);
  
  // Wrap App with BrowserRouter and QueryClientProvider
  root.render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  );
} else {
  console.error("Root element not found. Unable to mount React application.");
}
