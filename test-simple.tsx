import ReactDOM from 'react-dom/client';

console.log('Simple test loading...');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root found, rendering simple test...');
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <div style={{ color: 'white', padding: '20px', fontSize: '24px' }}>
      <h1>✅ React is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
    </div>
  );
  console.log('Simple test rendered!');
} else {
  console.error('Root element not found!');
}

