import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';

console.log('index.tsx loaded');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log('Root element found, creating React root...');

// Catch any errors during module import or rendering
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="color: red; padding: 20px; background: #1a1a1a; font-family: monospace;">
      <h1>Global Error</h1>
      <pre>${event.error?.message || String(event.error)}</pre>
      <pre>${event.error?.stack || ''}</pre>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="color: red; padding: 20px; background: #1a1a1a; font-family: monospace;">
      <h1>Unhandled Promise Rejection</h1>
      <pre>${event.reason?.message || String(event.reason)}</pre>
      <pre>${event.reason?.stack || ''}</pre>
    </div>`;
  }
});

try {
  console.log('Starting to import App...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root created, rendering App...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App rendered successfully!');
} catch (error) {
  console.error('Error rendering app:', error);
  rootElement.innerHTML = `<div style="color: red; padding: 20px; background: #1a1a1a; font-family: monospace;">
    <h1>Error Loading App</h1>
    <pre>${error instanceof Error ? error.message : String(error)}</pre>
    <pre>${error instanceof Error ? error.stack : ''}</pre>
  </div>`;
}
