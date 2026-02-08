import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import './styles/design-tokens.css';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plans" element={<div style={{padding: '2rem'}}>Plans Page (Coming Soon)</div>} />
          <Route path="/reports" element={<div style={{padding: '2rem'}}>Reports Page (Coming Soon)</div>} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
