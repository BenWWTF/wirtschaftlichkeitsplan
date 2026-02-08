import React from 'react';
import { BottomNavigation } from './BottomNavigation';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <BottomNavigation />
    </div>
  );
}
