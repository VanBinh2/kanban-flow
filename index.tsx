import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode removed temporarily to prevent double-invoking drag-and-drop init logic in some dev environments, 
  // though @hello-pangea/dnd supports it. keeping it safe for preview.
  <React.Fragment> 
    <App />
  </React.Fragment>
);