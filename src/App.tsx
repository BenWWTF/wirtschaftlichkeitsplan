import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import './styles/design-tokens.css';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plans" element={<div>Plans Page (Coming Soon)</div>} />
          <Route path="/reports" element={<div>Reports Page (Coming Soon)</div>} />
          <Route path="/settings" element={<div>Settings Page (Coming Soon)</div>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
