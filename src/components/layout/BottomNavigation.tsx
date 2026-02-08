import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './BottomNavigation.module.css';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '📊', path: '/' },
  { label: 'Pläne', icon: '📋', path: '/plans' },
  { label: 'Berichte', icon: '📈', path: '/reports' },
  { label: 'Einstellungen', icon: '⚙️', path: '/settings' },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`${styles.item} ${location.pathname === item.path ? styles.active : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
