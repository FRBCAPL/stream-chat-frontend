import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter as Router } from 'react-router-dom'; // <-- Add this line

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router> {/* <-- Wrap App in Router */}
      <App />
    </Router>
  </React.StrictMode>
);

