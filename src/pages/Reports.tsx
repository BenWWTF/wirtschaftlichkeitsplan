import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useIpc } from '../hooks/useIpc';
import styles from './Reports.module.css';

export function Reports() {
  const api = useIpc();
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(false);

  async function generatePDF() {
    setLoading(true);
    try {
      await api.generateReport('pdf', { month });
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateCSV() {
    setLoading(true);
    try {
      await api.generateReport('csv', { month });
    } catch (error) {
      console.error('CSV generation failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.reports}>
      <h1 className={styles.title}>Berichte</h1>

      <Card>
        <h2>Monatsbericht</h2>
        <div className={styles.form}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <div className={styles.actions}>
            <Button variant="primary" onClick={generatePDF} disabled={loading}>
              📄 PDF Exportieren
            </Button>
            <Button variant="secondary" onClick={generateCSV} disabled={loading}>
              📊 CSV Exportieren
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
