# Wirtschaftlichkeitsplan - Setup Anleitung

Diese Anleitung führt Sie Schritt für Schritt durch die Einrichtung des Financial Dashboards.

## Schritt 1: Supabase Projekt erstellen

### 1.1 Projekt anlegen
1. Öffnen Sie [supabase.com](https://supabase.com)
2. Melden Sie sich mit GitHub/Google/Email an
3. Klicken Sie auf "New Project"
4. Geben Sie einen Projektnamen ein (z.B. "finanzplanung-arztpraxis")

### 1.2 Region konfigurieren
**WICHTIG für DSGVO:** Wählen Sie als Region **EU-West-1 (Irland)**

Dies stellt sicher, dass:
- Ihre Daten in der EU gehostet werden
- Sie DSGVO-konform sind
- Datenschutz sichergestellt ist

### 1.3 Authentifizierung aktivieren
1. Warten Sie bis das Projekt aktiv ist
2. Gehen Sie zu **Settings → Auth Settings**
3. Unter "Email/Password" sollte es bereits aktiviert sein
4. Scrollen Sie nach unten und kopieren Sie die `Project URL` und `Publishable Key`

## Schritt 2: Projekt lokal konfigurieren

### 2.1 Environment Variablen setzen

Öffnen Sie `.env.local` und tragen Sie ein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...xxxxxxx
```

Diese Werte finden Sie in der Supabase Console unter **Settings → API**.

### 2.2 Verifizieren Sie die Werte
```bash
pnpm dev
```

Öffnen Sie http://localhost:3000 im Browser. Wenn die Seite lädt, sind die Konfigurationen korrekt.

## Schritt 3: Datenbank Schema erstellen

### 3.1 SQL Script ausführen

1. Öffnen Sie die Supabase Console für Ihr Projekt
2. Gehen Sie zu **SQL Editor** (linke Seitenleiste)
3. Klicken Sie auf **New Query**
4. Öffnen Sie `supabase/migrations/001_create_tables.sql` und kopieren Sie den gesamten Inhalt
5. Fügen Sie es in den SQL Editor ein
6. Klicken Sie auf **Run** (oder Cmd+Enter)

Warten Sie, bis das Script ausgeführt ist. Sie sollten sehen:
```
Query executed successfully
```

### 3.2 Verifyieren Sie die Tabellen

1. Gehen Sie zu **Table Editor** (linke Seitenleiste)
2. Sie sollten sehen:
   - therapy_types
   - monthly_plans
   - expenses
   - practice_settings

Wenn alle 4 Tabellen vorhanden sind, ist die Datenbank erfolgreich konfiguriert!

## Schritt 4: Authentifizierung testen

### 4.1 Registrierung testen

1. Öffnen Sie http://localhost:3000/signup
2. Füllen Sie das Formular aus:
   - **Praxisname**: "Testpraxis Dr. Schmidt"
   - **Email**: "test@example.com"
   - **Passwort**: "TestPassword123"
3. Klicken Sie auf "Kostenlos registrieren"

Sie sollten zu `/dashboard` weitergeleitet werden (Fehler ist normal, da das Dashboard noch nicht existiert).

### 4.2 Anmelden testen

1. Öffnen Sie http://localhost:3000/login
2. Verwenden Sie die Zugangsdaten von oben
3. Klicken Sie auf "Anmelden"

Wenn Sie weitergeleitet werden, funktioniert die Auth!

### 4.3 Benutzer in Supabase überprüfen

1. Gehen Sie in Supabase zu **Authentication → Users**
2. Ihr neuer Benutzer sollte aufgelistet sein
3. Sie sollten auch einen Eintrag in der `practice_settings` Tabelle sehen

## Schritt 5: Erste Daten testen

### 5.1 Test-Therapieart erstellen

1. Öffnen Sie die Supabase Console
2. Gehen Sie zu **Table Editor → therapy_types**
3. Klicken Sie auf "Insert Row"
4. Füllen Sie folgende Werte aus:
   - **user_id**: (Kopieren Sie die ID des Users aus der Auth)
   - **name**: "Einzelpsychotherapie"
   - **price_per_session**: 150
   - **variable_cost_per_session**: 20

5. Speichern Sie die Zeile

### 5.2 RLS Policies überprüfen

Sie sollten in der Lage sein, nur Ihre eigenen Daten zu sehen. Dies ist das Row Level Security System.

## Schritt 6: Development starten

### 6.1 Terminal öffnen

```bash
cd wirtschaftlichkeitsplan
pnpm dev
```

### 6.2 Browser öffnen

Öffnen Sie http://localhost:3000

Sie sollten sehen:
- Landing Page mit "Wirtschaftlichkeitsplan" Logo
- Buttons für "Anmelden" und "Kostenlos Starten"

## Häufige Fehler und Lösungen

### Fehler: "Invalid Supabase URL"
**Lösung**: Überprüfen Sie die `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

### Fehler: "Unauthorized" bei Datenbankzugriff
**Lösung**:
1. Überprüfen Sie, dass RLS Policies richtig konfiguriert sind
2. Führen Sie das SQL Script erneut aus

### Fehler: "No user found after signup"
**Lösung**:
1. Überprüfen Sie in Supabase Console → Users, ob der User erstellt wurde
2. Überprüfen Sie die Email-Bestätigung (falls konfiguriert)

### Build Fehler
**Lösung**:
```bash
rm -rf .next node_modules
pnpm install
pnpm build
```

## Nächste Schritte

Nachdem Sie diese Schritte abgeschlossen haben:

1. **Therapiearten-Management** (Phase 3)
   - Implementierung des CRUD-Interface
   - Data Table mit Therapiearten
   - Erstellen/Bearbeiten Dialog

2. **Monatliche Planung** (Phase 4)
   - Monatlicher Planer
   - Session-Planung
   - Revenue Berechnung

3. **Break-Even Analyse** (Phase 5)
   - Financial Calculations
   - KPI Dashboard

## Support

Bei Problemen:

1. **Supabase Docs**: https://supabase.com/docs
2. **Next.js Docs**: https://nextjs.org/docs
3. **TypeScript Docs**: https://www.typescriptlang.org/docs/

## Checkliste für Produktion

Bevor Sie die App in Produktion nehmen:

- [ ] Supabase Backup-Plan aktiviert
- [ ] Custom Domain konfiguriert (optional)
- [ ] Email-Authentifizierung konfiguriert (optional)
- [ ] Datenschutzerklärung und Impressum hinzugefügt
- [ ] AVV mit Supabase abgeschlossen
- [ ] RLS Policies überprüft
- [ ] Environment Variablen auf Vercel konfiguriert
- [ ] Build und Tests lokal durchgeführt

Viel Erfolg! 🚀
