import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Privacy Policy (Datenschutzerklärung) page
 * German (DSGVO-compliant) privacy policy for Austrian medical practices
 */
export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-4 inline-block">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Datenschutzerklärung
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Wirtschaftlichkeitsplan - Datenschutz und Datensicherheit
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-8 space-y-6 text-neutral-700 dark:text-neutral-300">

          {/* 1. Verantwortlicher */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              1. Verantwortlicher für die Datenverarbeitung
            </h2>
            <p>
              Der Verantwortliche für die Datenverarbeitung ist der Betreiber dieser Anwendung.
              Für Fragen zum Datenschutz kontaktieren Sie bitte den Administratoren der Anwendung.
            </p>
          </section>

          {/* 2. Arten personenbezogener Daten */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              2. Arten personenbezogener Daten
            </h2>
            <p className="mb-3">Wir verarbeiten folgende Arten personenbezogener Daten:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Benutzerdaten:</strong> E-Mail-Adresse, Passwort-Hash</li>
              <li><strong>Praxisdaten:</strong> Praxisname, Kontaktinformationen</li>
              <li><strong>Geschäftsdaten:</strong> Therapietypen, monatliche Planungen, Ausgaben, Geschäftseinstellungen</li>
              <li><strong>Technische Daten:</strong> IP-Adresse, Browserdaten, Zugriffslogs</li>
            </ul>
          </section>

          {/* 3. Rechtsgrundlage */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              3. Rechtsgrundlage der Datenverarbeitung
            </h2>
            <p className="mb-3">
              Die Verarbeitung personenbezogener Daten erfolgt auf Basis von:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Art. 6 Abs. 1 lit. a) DSGVO (Einwilligung durch Registrierung)</li>
              <li>Art. 6 Abs. 1 lit. b) DSGVO (Erfüllung des Nutzungsvertrags)</li>
              <li>Art. 6 Abs. 1 lit. c) DSGVO (Erfüllung rechtlicher Verpflichtungen)</li>
            </ul>
          </section>

          {/* 4. Zweck der Verarbeitung */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              4. Zweck der Datenverarbeitung
            </h2>
            <p className="mb-3">Ihre Daten werden verarbeitet für:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Bereitstellung der Wirtschaftlichkeitsplan-Anwendung</li>
              <li>Benutzerverwaltung und Authentifizierung</li>
              <li>Speicherung von Praxis- und Geschäftsdaten</li>
              <li>Sicherheit und Missbrauchsprävention</li>
              <li>Rechtliche Compliance und Audit-Anforderungen</li>
            </ul>
          </section>

          {/* 5. Speicherdauer */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              5. Speicherdauer personenbezogener Daten
            </h2>
            <p>
              Personenbezogene Daten werden solange gespeichert, wie das Benutzerkonto aktiv ist.
              Nach Löschen des Kontos werden Daten innerhalb von 30 Tagen gelöscht, soweit keine
              gesetzlichen Aufbewahrungspflichten bestehen.
            </p>
          </section>

          {/* 6. Datensicherheit */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              6. Datensicherheit
            </h2>
            <p className="mb-3">
              Wir implementieren umfassende technische und organisatorische Maßnahmen zum Schutz Ihrer Daten:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>TLS/SSL-Verschlüsselung für alle Datenübertragungen</li>
              <li>Verschlüsselung von Passwörtern mittels moderner Hash-Algorithmen</li>
              <li>Row-Level Security (RLS) für Datenisolation auf Datenbankebene</li>
              <li>Sichere Speicherung auf EU-Servern (Supabase, eu-central-1)</li>
              <li>Regelmäßige Sicherheitsaudits und Penetrationstests</li>
              <li>Keine Weitergabe an Dritte ohne Zustimmung</li>
            </ul>
          </section>

          {/* 7. Betroffenenrechte */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              7. Rechte der betroffenen Person
            </h2>
            <p className="mb-3">
              Sie haben das Recht auf:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Auskunft:</strong> Auskunft über Ihre verarbeiteten Daten</li>
              <li><strong>Berichtigung:</strong> Korrektur falscher Daten</li>
              <li><strong>Löschung:</strong> Löschung Ihrer Daten (Recht auf Vergessenwerden)</li>
              <li><strong>Einschränkung:</strong> Einschränkung der Verarbeitung</li>
              <li><strong>Portabilität:</strong> Export Ihrer Daten in strukturierter Form</li>
              <li><strong>Widerspruch:</strong> Widerspruch gegen Datenverarbeitung</li>
            </ul>
          </section>

          {/* 8. Kontakt */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              8. Kontakt und Beschwerden
            </h2>
            <p className="mb-3">
              Für Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie
              den Verantwortlichen für die Datenverarbeitung.
            </p>
            <p>
              Sie haben auch das Recht, sich bei der österreichischen Datenschutzbehörde
              (Österreichische Datenschutzbehörde) zu beschweren, wenn Sie der Ansicht sind,
              dass die Verarbeitung Ihrer personenbezogenen Daten gegen das DSGVO verstößt.
            </p>
          </section>

          {/* 9. EU-Datenschutzgrundverordnung */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              9. DSGVO-Konformität
            </h2>
            <p className="mb-3">
              Diese Anwendung ist konform mit:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Verordnung (EU) 2016/679 (Datenschutzgrundverordnung - DSGVO)</li>
              <li>Datenschutzgesetz (DSG) Österreich</li>
              <li>HIPAA-Anforderungen für Gesundheitsdaten (soweit anwendbar)</li>
            </ul>
          </section>

          {/* 10. Änderungen */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              10. Änderungen dieser Datenschutzerklärung
            </h2>
            <p>
              Wir behalten uns das Recht vor, diese Datenschutzerklärung jederzeit zu ändern.
              Änderungen werden durch die Veröffentlichung einer neuen Fassung auf dieser Website
              bekannt gemacht. Bitte überprüfen Sie diese Seite regelmäßig auf Änderungen.
            </p>
          </section>

          {/* Last updated */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Zuletzt aktualisiert: November 2024
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex gap-4">
          <Link href="/">
            <Button variant="outline">
              Zur Startseite
            </Button>
          </Link>
          <Link href="/signup">
            <Button>
              Kostenlos registrieren
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
