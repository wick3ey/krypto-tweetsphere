
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Get the root element
const rootElement = document.getElementById("root");

// Ensure the root element exists before attempting to render
if (rootElement) {
  const root = createRoot(rootElement);
  
  // Use a more direct rendering approach
  root.render(<App />);
} else {
  console.error("Root element not found. Unable to mount React application.");
}
