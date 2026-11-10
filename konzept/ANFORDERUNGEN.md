# Anforderungen der Leistungsbeschreibung im Click-Dummy

Stand: November 2026. Grundlage: *Leistungsbeschreibung Nutztierkosmos* (FBN, August 2026) und Antworten auf die Bieterfragen.

Diese Tabelle ist identisch mit dem Präsentationsmodus der Anwendung (`src/lib/requirements.svelte.ts`).

| LB | Anforderung | Umsetzung im Click-Dummy |
|---|---|---|
| 2 | Vollständig browserbasiert | Läuft ohne Installation in jedem aktuellen Browser. |
| 2 | Pflege ohne Quellcode | Kategorien, Themen, Ausstellungen und Quizze werden in der Redaktion gepflegt. |
| 4 | Zielgruppen | Einstiege für Öffentlichkeit, Schule, Studium/Wissenschaft und Presse; Ausstellungen sind Zielgruppen zugeordnet. |
| 4 | Verständlich ohne Vorkenntnisse | „Das Wichtigste in Kürze“, kurze Absätze, Fachbegriffe werden erklärt. |
| 5.1 | Hierarchische Inhaltsstruktur | Tierart → Themenschwerpunkt → Ausstellung; nichts davon ist im Code festgelegt. |
| 5.1 | Kategorien anlegen, ändern, sortieren, deaktivieren | Unter Redaktion → Struktur; „Schaf & Ziege“ ist als deaktiviertes Beispiel angelegt. |
| 5.1 | Ausstellungen auf Basis von Publikationen | Jede Ausstellung verknüpft eine oder mehrere Publikationen und ist austauschbar. |
| 5.1 | Publikationsangaben | Titel, Autor/innen, Datum, Kurzbeschreibung, Schlagwörter, Quelle/Link, verknüpfte Medien. |
| 5.2 | Volltextsuche und Schlagwortkatalog | Suche über Titel, Text, Publikationen; Schlagwörter redaktionell gepflegt. |
| 5.2 | Filter nach Tierart und Themengebiet | Plus Inhaltstyp und Schlagwort. |
| 5.2 | Sortierung nach Relevanz/Aktualität | Logik auf der Suchseite offen dokumentiert. |
| 5.2 | Suche mobil bedienbar | Filter klappen auf dem Smartphone in ein eigenes Panel. |
| 5.3 | Bilder, Galerien, Videos, Infografiken, Audio, PDF | Alle Formate in der Beispiel-Ausstellung „Hitzestress“. |
| 5.3 / 8 | Alternativtexte und Untertitel | Alt-Text-Pflicht für Bilder, WebVTT-Untertitel DE/EN, Transkripte für Audio/Video. |
| 5.3 | Zentrale Medienverwaltung | Medienbibliothek mit Verwendungsnachweis. |
| 5.3 | Keine Layoutverschiebungen | Feste Seitenverhältnisse für alle Medien. |
| 5.3 | Restriktive Downloadbereitstellung | Global konfigurierbar, zusätzlich pro Medium freigebbar. |
| 5.4 | Quiz, Multiple Choice, Richtig/Falsch, Bilderrätsel, Zuordnung | Alle Typen im „Hitzestress-Check“. |
| 5.4 | Unmittelbares Feedback | Nach jeder Antwort: richtig/falsch mit Erklärung. |
| 5.4 | Interaktive Inhalte ohne Programmierkenntnisse | Formular-Editor für alle Fragetypen. |
| Bieterfrage | Interaktive Infografiken + Werkzeug | THI-Rechner (vom AN gebaut) sowie Balken- und Hotspot-Grafiken, redaktionell pflegbar. |
| 5.5 | Gamification ohne Zugangshürde | Kein Login, nichts gesperrt. Forscherpass freiwillig und nur auf dem Gerät. |
| 6 | Rollen und Rechte, Mehrbenutzerbetrieb | Administration, Redaktion, Fachprüfung, Auswertung. |
| 6 | Vorschau vor Veröffentlichung | Jede Fassung lässt sich in der öffentlichen Ansicht prüfen. |
| 6 | Versionierung / Historie | Jede Speicherung und jeder Statuswechsel erzeugt eine Version; Wiederherstellen möglich. |
| 6 / 9.2 | Admin nur nach Anmeldung | Redaktionsbereich mit Anmeldung; Bereiche je nach Rolle. |
| 7 | Seriöses, wissenschaftsnahes Design | Ruhige Typografie, Quellen sichtbar, Platzhalter klar gekennzeichnet. |
| 7 | Responsiv, Mobile First | Ab 320 px Breite nutzbar. |
| 7 | Deutsch und Englisch | Inhalte und Navigation sprachabhängig pflegbar. |
| 7 | Sprachwechsel ohne Kontextverlust | Seite bleibt gleich; fehlt eine Übersetzung, erscheint ein Hinweis. |
| 8 | Barrierefreiheit (BITV 2.0 / WCAG) | Tastatur, Fokusrahmen, Sprunglink, Landmarken, Kontraste, nicht nur Farbe. |
| 8 | Prüfung und Restabweichungen | Erklärung zur Barrierefreiheit mit Stand und Behebungsplan. |
| 9.2 | Protokoll sicherheitsrelevanter Ereignisse | Anmeldungen, Fehlversuche, Rollenänderungen, Veröffentlichungen. |
| 9.2 | Datensparsam, Einwilligung | Keine Cookies, keine Personendaten; Speicherung nur nach Zustimmung. |
| 10 | Nutzungsstatistik | Seitenaufrufe, beliebte Themen, Quiz-Nutzung, Erfolgsquoten. |
| 10 | Konfiguration nachvollziehbar | Jede Messung einzeln schaltbar, mit Speicherdauer und Erklärung. |
| Anlage A | Übersetzungsworkflow DE/EN | Übersicht fehlender Übersetzungen und pflegbare Oberflächentexte. |

## Bewusst nicht Teil des Click-Dummys

Diese Punkte gehören in Feinkonzept und Umsetzung (LB 9, 11–14, Anlage A):

- echtes Backend/CMS mit Datenbank, Authentifizierung (z. B. SSO), HTTPS-Betrieb, Hosting
- serverseitige Bildoptimierung, Caching-Konzept, Lasttests mit Zielwerten
- formale Barrierefreiheitsprüfung (BITV-Test) mit Prüfbericht
- Dokumentation (System, Betrieb, Administration, Redaktion), Schulung
- Aufbewahrungs- und Löschfristen, Auftragsverarbeitung, Nutzungsrechte
