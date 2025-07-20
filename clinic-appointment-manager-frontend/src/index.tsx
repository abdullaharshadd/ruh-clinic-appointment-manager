import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/App.css';
import App from './App.tsx';

// Get the root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

// Create React root
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hot Module Replacement for development
if (module.hot) {
  module.hot.accept('./App.tsx', () => {
    const NextApp = require('./App.tsx').default;
    root.render(
      <React.StrictMode>
        <NextApp />
      </React.StrictMode>
    );
  });
}

// Performance measuring (optional)
const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }).catch(() => {
      // web-vitals not available, ignore
    });
  }
};

// Measure performance in production
if (process.env.NODE_ENV === 'production') {
  reportWebVitals(console.log);
}

// Service Worker registration (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}