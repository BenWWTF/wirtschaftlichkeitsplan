import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import styles from './Settings.module.css';

export function Settings() {
  const [apiUrl, setApiUrl] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');

  async function saveRemoteConfig() {
    console.log('Saving remote config:', { apiUrl, apiKey });
    // TODO: Implement sync configuration
  }

  return (
    <div className={styles.settings}>
      <h1 className={styles.title}>Einstellungen</h1>

      <Card>
        <h2>Remote-Synchronisierung (Alle-inkl)</h2>
        <div className={styles.form}>
          <Input
            label="API-URL"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.example.com"
          />
          <Input
            label="API-Schlüssel"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your API key"
          />
          <Button variant="primary" onClick={saveRemoteConfig}>
            Speichern
          </Button>
        </div>
      </Card>

      <Card>
        <h2>Auto-Sync</h2>
        <label>
          <input type="checkbox" defaultChecked /> Auto-Sync aktivieren
        </label>
      </Card>

      <Card>
        <h2>Über diese App</h2>
        <p>Wirtschaftlichkeitsplan v1.0.0</p>
        <p>Lokale SQLite-Datenbank mit Alle-inkl MariaDB Sync</p>
      </Card>
    </div>
  );
}
