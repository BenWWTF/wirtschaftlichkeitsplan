import { getDatabase } from './database';

export async function generateMonthlyReportPDF(month: string): Promise<Buffer> {
  const db = getDatabase();

  // Fetch data
  const therapyTypes = db.prepare('SELECT * FROM therapy_types').all();
  const monthlyPlans = db.prepare(
    'SELECT * FROM monthly_plans WHERE strftime("%Y-%m", month) = ?'
  ).all(month.substring(0, 7));
  const expenses = db.prepare(
    'SELECT * FROM expenses WHERE strftime("%Y-%m", expense_date) = ?'
  ).all(month.substring(0, 7));

  // Calculate summary
  const totalRevenue = (monthlyPlans as any[]).reduce((sum: number, plan: any) => {
    const therapyType = (therapyTypes as any[]).find(t => t.id === plan.therapy_type_id);
    return sum + (plan.planned_sessions * (therapyType?.price_per_session || 0));
  }, 0);

  const totalExpenses = (expenses as any[]).reduce((sum: number, exp: any) => sum + exp.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  // Generate simple HTML report
  const reportHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #101010; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #D0D0D0; }
          th { background-color: #F1F1F1; font-weight: bold; }
          .summary { margin: 20px 0; }
          .summary-item { margin: 10px 0; font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>Monatsbericht ${month}</h1>

        <div class="summary">
          <h2>Zusammenfassung</h2>
          <div class="summary-item"><strong>Geplante Einnahmen:</strong> €${totalRevenue.toFixed(2)}</div>
          <div class="summary-item"><strong>Ausgaben:</strong> €${totalExpenses.toFixed(2)}</div>
          <div class="summary-item"><strong>Nettoeinkommen:</strong> €${netIncome.toFixed(2)}</div>
        </div>

        <h2>Therapietypen (${therapyTypes.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Preis pro Sitzung</th>
              <th>Variablekosten</th>
              <th>Sitzungen</th>
            </tr>
          </thead>
          <tbody>
            ${(therapyTypes as any[]).map(type => {
              const sessions = (monthlyPlans as any[]).filter(p => p.therapy_type_id === type.id).length;
              return `
                <tr>
                  <td>${type.name}</td>
                  <td>€${type.price_per_session.toFixed(2)}</td>
                  <td>€${type.variable_cost_per_session.toFixed(2)}</td>
                  <td>${sessions}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <h2>Ausgaben (${expenses.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Kategorie</th>
              <th>Betrag</th>
              <th>Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            ${(expenses as any[]).map(exp => `
              <tr>
                <td>${exp.category}</td>
                <td>€${exp.amount.toFixed(2)}</td>
                <td>${exp.description || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  return Buffer.from(reportHtml);
}

export async function generateMonthlyReportCSV(month: string): Promise<string> {
  const db = getDatabase();

  const therapyTypes = db.prepare('SELECT * FROM therapy_types').all();
  const monthlyPlans = db.prepare(
    'SELECT * FROM monthly_plans WHERE strftime("%Y-%m", month) = ?'
  ).all(month.substring(0, 7));

  let csv = 'Therapietype,Sitzungen,Preis,Einnahmen\n';

  (therapyTypes as any[]).forEach((type: any) => {
    const sessions = (monthlyPlans as any[]).filter((p: any) => p.therapy_type_id === type.id).length;
    const revenue = sessions * type.price_per_session;
    csv += `"${type.name}",${sessions},€${type.price_per_session.toFixed(2)},€${revenue.toFixed(2)}\n`;
  });

  return csv;
}
