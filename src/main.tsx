
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize root without StrictMode to prevent double-rendering
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
