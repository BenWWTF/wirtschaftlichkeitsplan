import { Metadata } from 'next'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export const metadata: Metadata = {
  title: 'Barrierefreiheitserklärung - Wirtschaftlichkeitsplan',
  description: 'Unsere Verpflichtung zur Barrierefreiheit und WCAG 2.1 AA Compliance',
}

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <section className="border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-8">
          <Breadcrumb
            items={[{ label: 'Barrierefreiheit', href: '/accessibility' }]}
            className="text-xs sm:text-sm"
          />
        </section>

        {/* Header */}
        <section className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            Barrierefreiheitserklärung
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">
            Unser Engagement für digitale Barrierefreiheit und Inklusion
          </p>
        </section>

        {/* Main Content */}
        <article className="prose dark:prose-invert max-w-none space-y-8">
          {/* Commitment Section */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Unsere Verpflichtung
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              Die Wirtschaftlichkeitsplan-Anwendung soll für alle Menschen zugänglich sein,
              unabhängig von ihren Fähigkeiten. Wir sind verpflichtet, digitale Barrierefreiheit
              gemäß der Web Content Accessibility Guidelines (WCAG) 2.1 Level AA zu implementieren.
            </p>
          </section>

          {/* Compliance Section */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Compliance-Status
            </h2>
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                ✅ WCAG 2.1 Level AA
              </h3>
              <p className="text-green-800 dark:text-green-200">
                Die Anwendung erfüllt die Richtlinien für Barrierefreiheit von Webinhalten
                (WCAG) 2.1 auf Stufe AA und ist damit kompatibel mit internationalen Standards
                für Barrierefreiheit.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              Barrierefreiheitsmerkmale
            </h3>
            <ul className="space-y-3 text-neutral-600 dark:text-neutral-300">
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                <span>
                  <strong>Tastaturnavigation:</strong> Vollständige Navigationsmöglichkeit mit
                  der Tastatur ohne Maus
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                <span>
                  <strong>Sichtbare Fokusindikatoren:</strong> Deutliche visuelle Anzeige des
                  aktuellen Fokus
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                <span>
                  <strong>Farbkontrast:</strong> Mindestkontrastverhältnis von 4.5:1 für normalen
                  Text
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                <span>
                  <strong>Semantisches HTML:</strong> Korrekte Verwendung von HTML-Elementen
                  für besseres Verständnis
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                <span>
                  <strong>ARIA-Attribute:</strong> Accessible Rich Internet Applications (ARIA)
                  für erweiterte Funktionalität
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                <span>
                  <strong>Live-Regionen:</strong> Ankündigungen für dynamische Inhaltsänderungen
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                <span>
                  <strong>Dark Mode:</strong> Unterstützung für dunkles Theme mit erhaltener
                  Barrierefreiheit
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
                <span>
                  <strong>Mobile Optimierung:</strong> Touch-freundliche Bedienelemente mit
                  mindestens 44x44px
                </span>
              </li>
            </ul>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Tastaturkürzel
            </h2>
            <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-neutral-600 dark:text-neutral-300">Tab</span>
                  <span className="text-neutral-900 dark:text-white font-semibold">
                    Zum nächsten Element springen
                  </span>
                </div>
                <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
                <div className="flex justify-between items-start">
                  <span className="text-neutral-600 dark:text-neutral-300">Shift + Tab</span>
                  <span className="text-neutral-900 dark:text-white font-semibold">
                    Zum vorherigen Element springen
                  </span>
                </div>
                <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
                <div className="flex justify-between items-start">
                  <span className="text-neutral-600 dark:text-neutral-300">Enter</span>
                  <span className="text-neutral-900 dark:text-white font-semibold">
                    Element aktivieren
                  </span>
                </div>
                <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
                <div className="flex justify-between items-start">
                  <span className="text-neutral-600 dark:text-neutral-300">Space</span>
                  <span className="text-neutral-900 dark:text-white font-semibold">
                    Schaltfläche aktivieren
                  </span>
                </div>
                <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
                <div className="flex justify-between items-start">
                  <span className="text-neutral-600 dark:text-neutral-300">Escape</span>
                  <span className="text-neutral-900 dark:text-white font-semibold">
                    Dialog/Popover schließen
                  </span>
                </div>
                <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
                <div className="flex justify-between items-start">
                  <span className="text-neutral-600 dark:text-neutral-300">Pfeiltasten</span>
                  <span className="text-neutral-900 dark:text-white font-semibold">
                    Durch Optionen navigieren
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Known Issues */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Bekannte Einschränkungen
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              Derzeit sind keine Einschränkungen bekannt, die die Barrierefreiheit der Anwendung
              beeinträchtigen. Wir arbeiten kontinuierlich an der Verbesserung der Zugänglichkeit
              und nehmen Feedback zu Barrierefreiheitsproblemen ernst.
            </p>
          </section>

          {/* Testing & Validation */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Tests und Überprüfung
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              Die Barrierefreiheit dieser Anwendung wurde durch folgende Methoden überprüft:
            </p>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-300 list-disc list-inside">
              <li>Automatisierte Accessibility-Tests (Axe, Lighthouse)</li>
              <li>Manuelle Überprüfung mit Screen Readern</li>
              <li>Tastaturnavigations-Tests</li>
              <li>Farbkontrast-Überprüfung</li>
              <li>WCAG 2.1 AA Compliance-Validierung</li>
            </ul>
          </section>

          {/* Contact & Feedback */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Feedback und Kontakt
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              Falls Sie auf Barrierefreiheitsprobleme oder fehlende Funktionen stoßen,
              kontaktieren Sie uns bitte. Wir nehmen Ihr Feedback ernst und arbeiten
              daran, die Anwendung für alle Nutzer zugänglich zu machen.
            </p>
          </section>

          {/* Standards & References */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Standards und Richtlinien
            </h2>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-300">
              <li>
                <a
                  href="https://www.w3.org/WAI/WCAG21/quickref/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  WCAG 2.1 - Web Content Accessibility Guidelines
                </a>
              </li>
              <li>
                <a
                  href="https://www.w3.org/WAI/ARIA/apg/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ARIA Authoring Practices Guide
                </a>
              </li>
              <li>
                <a
                  href="https://www.w3.org/WAI/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Web Accessibility Initiative (WAI)
                </a>
              </li>
            </ul>
          </section>

          {/* Last Updated */}
          <section className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Diese Barrierefreiheitserklärung wurde zuletzt aktualisiert am 30. November 2025.
            </p>
          </section>
        </article>
      </div>
    </main>
  )
}
