import React, { useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDashboardStore } from '../stores/dashboardStore';
import { useIpc } from '../hooks/useIpc';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const api = useIpc();
  const {
    currentMonth,
    setCurrentMonth,
    therapyTypes,
    setTherapyTypes,
    monthlyPlans,
    setMonthlyPlans,
    expenses,
    setExpenses,
    summary,
    setSummary,
    loading,
    setLoading,
    error,
    setError,
  } = useDashboardStore();

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [types, plans, expensesData, monthlySummary] = await Promise.all([
        api.getTherapyTypes(),
        api.getMonthlyPlans(currentMonth),
        api.getExpenses(currentMonth),
        api.getMonthlySummary(currentMonth),
      ]);

      setTherapyTypes(types);
      setMonthlyPlans(plans);
      setExpenses(expensesData);
      setSummary(monthlySummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = summary?.plannedRevenue || 0;
  const totalExpensesAmount = summary?.totalExpenses || 0;
  const netIncome = (summary?.netIncomeePlanned || 0);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.monthSelector}>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
          />
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <>
          <div className={styles.grid}>
            <Card>
              <h3 className={styles.cardTitle}>Geplante Einnahmen</h3>
              <p className={styles.amount}>€{totalRevenue.toFixed(2)}</p>
            </Card>
            <Card>
              <h3 className={styles.cardTitle}>Ausgaben</h3>
              <p className={styles.amount}>€{totalExpensesAmount.toFixed(2)}</p>
            </Card>
            <Card>
              <h3 className={styles.cardTitle}>Nettoeinkommen</h3>
              <p className={`${styles.amount} ${netIncome > 0 ? styles.positive : styles.negative}`}>
                €{netIncome.toFixed(2)}
              </p>
            </Card>
          </div>

          <Card className={styles.therapyTypesCard}>
            <h2 className={styles.sectionTitle}>Therapietypen ({therapyTypes.length})</h2>
            {therapyTypes.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Preis/Sitzung</th>
                    <th>Variable Kosten</th>
                    <th>Sitzungen</th>
                  </tr>
                </thead>
                <tbody>
                  {therapyTypes.map((type) => {
                    const sessions = monthlyPlans.filter(p => p.therapy_type_id === type.id);
                    return (
                      <tr key={type.id}>
                        <td>{type.name}</td>
                        <td>€{type.price_per_session}</td>
                        <td>€{type.variable_cost_per_session}</td>
                        <td>{sessions.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className={styles.empty}>Noch keine Therapietypen erstellt</p>
            )}
          </Card>

          {expenses.length > 0 && (
            <Card className={styles.expensesCard}>
              <h2 className={styles.sectionTitle}>Ausgaben ({expenses.length})</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Kategorie</th>
                    <th>Beschreibung</th>
                    <th>Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.category}</td>
                      <td>{expense.description || '-'}</td>
                      <td>€{expense.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
