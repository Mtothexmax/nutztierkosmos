# Nutztierkosmos – Click-Dummy (Grobkonzept)

Klickbarer Entwurf der **webbasierten Informations- und Wissensplattform mit Gamification-Elementen** für das Forschungsinstitut für Nutztierbiologie (FBN). Grundlage ist die Leistungsbeschreibung (Stand August 2026) unter `vergabeunterlagen/`.

Technik: SvelteKit, Svelte 5, Tailwind CSS 4. Kein Backend – alle Daten liegen im `localStorage` des Browsers. Die Speicherschicht (`src/lib/storage/db.ts`) ist so gekapselt, dass sie später gegen eine API/ein CMS getauscht werden kann.

## Starten

```sh
npm install
npm run dev      # http://localhost:5173
npm run check    # Typprüfung
npm run build
```

## Rundgang für die Vorstellung

1. **Startseite** `/` – Suche, Einstieg nach Tierart, neue Ausstellungen, Einstiege für Zielgruppen.
2. **Beispiel-Ausstellung** `/ausstellung/wenn-es-der-kuh-zu-heiss-wird` – enthält alle Medienformate: Kernaussagen, Text, interaktiver THI-Rechner, Video mit Untertiteln DE/EN, Hotspot-Grafik, Galerie, Audio mit Transkript, PDF, Quiz, Publikationen mit Quellenangabe.
3. **Sprachumschalter DE/EN** oben rechts – die Seite bleibt gleich; fehlt eine Übersetzung, kommt ein Hinweis (z. B. bei „Methan aus dem Pansen“).
4. **Suche** `/suche` – Volltext, Filter nach Tierart, Themengebiet, Inhaltstyp, Schlagwort, Zielgruppe; Sortierung nach Relevanz/Aktualität.
5. **Quiz** „Hitzestress-Check“ – Multiple Choice, Richtig/Falsch, Bilderrätsel (Klick ins Bild), Zuordnung; sofortiges Feedback. Ohne Anmeldung.
6. **Mitmachen** `/mitmachen` – freiwilliger, anonymer Forscherpass mit Abzeichen (nur nach Zustimmung, nur auf dem Gerät).
7. **Redaktion** `/admin` – Demo-Konten auf der Anmeldeseite, Passwort `demo`:
   - Tom Albers (Redaktion) reicht „Kalk für starke Schalen“ zur Prüfung ein,
   - Dr. Lea Hoffmann (Fachprüfung) gibt frei → Ausstellung ist öffentlich,
   - Jana Krüger (Administration) sieht Benutzer, Protokoll, Einstellungen.

**Präsentationsmodus:** Unten rechts zeigt ein Button, welche Anforderungen der Leistungsbeschreibung der aktuelle Screen abdeckt. Abschaltbar unter *Redaktion → Einstellungen*. Die vollständige Zuordnung steht in [`docs/ANFORDERUNGEN.md`](docs/ANFORDERUNGEN.md).

**Zurücksetzen:** *Redaktion → Einstellungen → Demo-Daten zurücksetzen* (oder `localStorage` mit Präfix `ntk:` leeren).

> Alle Publikationen, Personen und Zahlenwerte sind Platzhalter, keine echten FBN-Veröffentlichungen.

## Routen

| Route | Inhalt |
|---|---|
| `/` | Startseite |
| `/themen`, `/themen/[kategorie]`, `/themen/[kategorie]/[thema]` | Ebene 1 und 2 |
| `/ausstellung/[slug]` | Ebene 3, mit `?vorschau=1` für angemeldete Redaktion auch unveröffentlicht |
| `/suche` | Suche mit Filtern (Zustand in der URL) |
| `/mitmachen` | Quizze, Spiele, Forscherpass |
| `/info/[seite]` | `ueber`, `barrierefreiheit`, `datenschutz`, `impressum` |
| `/quiz/[id]`, `/spielen/[id]`, `/ergebnis/[typ]/[id]` | Quiz-Player, Spiel-Host, Ergebnis |
| `/admin/...` | Redaktion: Übersicht, Ausstellungen, Struktur, Publikationen, Schlagwörter, Medien, Quiz & Spiele, Infografiken, Texte & Übersetzungen, Statistik, Benutzer & Rollen, Protokoll, Einstellungen, Spiel-API |

## Projektstruktur

```
src/lib/types.ts                 Datenmodell (Kategorie → Thema → Ausstellung, Publikation, Medien …)
src/lib/i18n.svelte.ts           Oberflächentexte DE/EN, Sprachlogik
src/lib/requirements.svelte.ts   Anforderungskatalog für den Präsentationsmodus
src/lib/storage/                 localStorage-Zugriff, Demo-Inhalte (seed.ts)
src/lib/stores/                  content (Inhalte, Suche, Workflow, Statistik), session (Rollen), pass (Forscherpass)
src/lib/components/site/         Öffentliche Komponenten (Header, Karten, Medien, Galerie …)
src/lib/components/info/         Interaktive Infografiken (THI-Rechner, Balken, Hotspots)
src/lib/components/admin/        Redaktions-Komponenten (zweisprachige Felder, Quiz-Editor …)
static/demo/                     Platzhalter-Medien (SVG, MP4 + WebVTT, MP3, PDF)
static/fonts/                    Inter und Lora lokal (keine externen Abrufe)
```

## Aufräumen nach dem Umbau

Diese Dateien stammen aus dem ersten Entwurf und sind nur noch Weiterleitungen bzw. leer – sie können gelöscht werden:
`src/routes/lernen/`, `src/routes/admin/spieler/`, `src/lib/components/PlayerHeader.svelte`.

## Spiel-API

HTML-Spiele (ZIP) laufen weiter isoliert im iframe und kommunizieren über `postMessage` – siehe [`docs/GAME-API.md`](docs/GAME-API.md) und `/admin/api`.
