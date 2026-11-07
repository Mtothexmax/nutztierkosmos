# Nutztierkosmos

Frontend-only Click-Dummy einer Lernplattform zum FBN-Forschungsthema Nutztierhaltung: SvelteKit, Tailwind CSS, alles im Browser gespeichert. Kein Backend, keine Datenbank, kein echter Login.

## Starten

```sh
npm install
npm run dev
```

Danach `http://localhost:5173` öffnen. Build und Typecheck:

```sh
npm run check
npm run build
npm run preview
```

## Demo-Modus

- **Spielerbereich:** Name und Avatar wählen, Module, Quizze und Spiele durchspielen. Punkte und Fortschritt landen in `localStorage`.
- **Redaktion:** Auf der Startseite „Als Redaktion anmelden“. Der Adminbereich ist eine Demo-Sitzung ohne Guard.
- **Zurücksetzen:** Unter *Einstellungen → Demo-Daten zurücksetzen* werden alle `ntk:v1:*`-Keys neu geseedet.

## Spiele

Quizze und HTML-Spiele liegen in einer gemeinsamen Liste unter `/admin/spiele`. „Neues Spiel“ bietet fünf gleichwertige Einstiege:

1. Multiple Choice
2. Richtig / Falsch
3. Bilderrätsel
4. Zuordnung
5. HTML-Spiel als ZIP-Paket

Quiz-Editoren haben zwei Screens: Grundeinstellungen und Inhaltseditor. HTML-Spiel-Editoren ebenfalls: Grundeinstellungen sowie Dateien & Vorschau mit ZIP-Upload, Explorer, Texteditor und Live-Preview.

HTML-Spiele laufen isoliert im iframe (`sandbox="allow-scripts allow-forms allow-popups"`, ohne `allow-same-origin`) und kommunizieren ausschließlich per `postMessage`. Erlaubt sind HTML, CSS, JS, Bilder, Audio und Video; andere Dateien werden aus Sicherheitsgründen nicht übernommen. Assets werden beim Start in das HTML eingebettet, weil `srcdoc` keine relativen Dateien laden kann.

- API-Doku: `/admin/api`
- Vollständige Dokumentation: [`docs/GAME-API.md`](docs/GAME-API.md)
- Copy-Paste-Skill für KI-Assistenten: Button „KI-Skill kopieren“ im Spiel-Editor bzw. in der API-Doku

## Routen

| Route | Inhalt |
|---|---|
| `/` | Anmeldung |
| `/lernen` | Module, Fortschritt, Bestenliste |
| `/lernen/[moduleId]` | Modul mit Stationen |
| `/quiz/[quizId]` | Quiz-Player |
| `/spielen/[gameId]` | HTML-Spiel im iframe |
| `/ergebnis/[type]/[id]` | Ergebnis |
| `/admin` | Redaktions-Dashboard |
| `/admin/spiele` | Gemeinsame Spiele-Liste |
| `/admin/quiz/[id]` | Quiz-Editor |
| `/admin/spiele/[id]` | HTML-Spiel-Editor |
| `/admin/api` | Spiel-API v1 und KI-Skill (verlinkt im ZIP-Editor) |
| `/admin/spieler` | Spieler und Scores |
| `/admin/mediathek` | Medien |
| `/admin/einstellungen` | Einstellungen und Reset |

## Speicherung

Alles liegt unter `ntk:v1:*` in `localStorage`. Bei einem Versionssprung von `SEED_VERSION` werden die Demo-Daten neu angelegt. Die Spiele-Pakete werden als `GameFile[]` gespeichert; alte Einzel-HTML-Spiele werden beim Laden automatisch migriert.

## Projektstruktur

```
src/lib/bridge/          postMessage-Bridge und Protokollvalidierung
src/lib/games/           ZIP-Verarbeitung, Asset-Inlining, API-Texte
src/lib/stores/          Content-, Session- und Toast-Stores
src/lib/storage/         localStorage-Zugriff und Seed-Daten
src/routes/admin/        Redaktionsbereich
src/routes/spielen/      Spiel-Host
src/routes/quiz/         Quiz-Player
docs/GAME-API.md         Spiel-API, ZIP-Regeln und KI-Skill
```
