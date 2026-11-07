# Nutztierkosmos – Umsetzungsplan (Click-Dummy, Frontend-only)

Stand: 06.11.2026 · Basis: `requirements.txt` + Abstimmung „Click-Dummy, Speicherung im Browser, Spiele im iframe mit postMessage, Admin-Modus nur simuliert"

---

## 1. Ziel & Scope

Eine lauffähige **Frontend-Demo** der Plattform „Nutztierkosmos", die ohne Backend und ohne Datenbank auskommt:

- Alle Inhalte (Module, Quizze, Spiele, Spieler, Scores) liegen in **`localStorage`**.
- Der Admin-Bereich ist **immer schon angemeldet** (Demo-Redaktion) – kein echter Login, keine Rechteprüfung.
- Spiele laufen **isoliert im `<iframe>`** (sowohl importiertes HTML als auch im Editor erzeugte Spiele).
- Kommunikation Plattform ↔ Spiel ausschließlich über **`postMessage`** mit definiertem Protokoll.
- Mindestens **ein vollständiges Beispielmodul** auf Basis eines FBN-Forschungsthemas.

### Nicht in Scope (bewusst)

| Thema | Entscheidung |
|---|---|
| Datenbank / API / Server | ❌ keine – nur `localStorage` |
| Echte Authentifizierung | ❌ Dummy-Session mit Name + Avatar |
| Datei-Upload auf Server | ❌ Bilder als Data-URL im `localStorage` oder Emoji-Platzhalter |
| Mehrbenutzer-Sync | ❌ ein Browser = ein Gerät |
| Redaktions-Rollen/Rechte | ❌ nur simulierte Anzeige „Redaktion (Demo)" |
| PDF-/DOCX-Import | ❌ nur HTML-Paste |

---

## 2. Architekturentscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| A1 | **localStorage** statt IndexedDB | einfacher, synchron, ausreichend für Demo; Kapselung in `db.ts` erlaubt späteren Wechsel |
| A2 | **Versionierter Storage-Key** `ntk:v1:*` + `seedVersion` | Migration/Reset möglich, Demo-Daten reproduzierbar |
| A3 | **Svelte 5 Runes** (`$state`, `$derived`) + Store-Module | zeitgemäß, kein externer State-Manager nötig |
| A4 | Spiele als **String** (`html` oder `code`) im Datensatz | erfüllt „Spiele müssen als Code gespeichert werden" |
| A5 | Ausführung via `<iframe srcdoc sandbox="allow-scripts allow-forms allow-popups">` | Isolation; **kein** `allow-same-origin` → Spiel kann Host-Storage nicht lesen |
| A6 | **postMessage-Protokoll v1** mit `source`-Feld + Runtime-Validierung | fremde Messages werden ignoriert |
| A7 | Admin unter `/admin` ohne Guard | „so aussehen als wäre man angemeldet" |
| A8 | Kein UI-Framework, nur **Tailwind v4 + Material Symbols** | bereits installiert, volle Design-Kontrolle |
| A9 | Design kommt als **ein HTML-Deliverable** von Claude Design | schnelle Iteration, danach 1:1-Portierung nach Svelte |

---

## 3. Datenmodell (`src/lib/types.ts`)

```ts
export type ID = string;

export type Module = {
  id: ID;
  title: string;              // "Milchkuh & Klima"
  subtitle: string;
  description: string;
  emoji: string;              // Kachel-Icon
  color: 'forest' | 'amber' | 'sky' | 'berry';
  published: boolean;
  order: number;
};

export type Player = {
  id: ID;
  name: string;
  avatar: string;             // Emoji
  createdAt: string;
  lastActiveAt: string;
};

export type Score = {
  id: ID;
  playerId: ID;
  refType: 'quiz' | 'game';
  refId: ID;
  points: number;
  maxPoints: number;
  durationMs: number;
  at: string;
};

export type BaseQuestion = {
  id: ID;
  prompt: string;
  explanation?: string;
  points: number;
  imageUrl?: string;          // Data-URL oder Emoji-Platzhalter
};

export type McQuestion = BaseQuestion & {
  type: 'mc';
  options: { id: ID; text: string; correct: boolean }[];
  multiple: boolean;
};

export type TfQuestion = BaseQuestion & {
  type: 'tf';
  correct: boolean;
};

export type ImageQuestion = BaseQuestion & {
  type: 'image';
  mode: 'choice' | 'input';
  options?: { id: ID; text: string; correct: boolean }[];
  answer?: string;            // bei mode: 'input'
  tolerance?: 'exact' | 'loose';
};

export type MatchQuestion = BaseQuestion & {
  type: 'match';
  left: { id: ID; text: string }[];
  right: { id: ID; text: string }[];
  solution: { leftId: ID; rightId: ID }[];
};

export type Question = McQuestion | TfQuestion | ImageQuestion | MatchQuestion;

export type Quiz = {
  id: ID;
  moduleId: ID;
  title: string;
  description: string;
  questions: Question[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GameFileKind = 'html' | 'css' | 'js' | 'image' | 'audio' | 'video';

export type GameFile = {
  path: string;               // Pfad im ZIP-Paket, z. B. "assets/bild.png"
  kind: GameFileKind;
  mime: string;
  encoding: 'utf8' | 'base64';
  content: string;            // Quelltext (utf8) oder Base64 (Binärdatei)
  size: number;
};

export type Game = {
  id: ID;
  moduleId: ID;
  title: string;
  description: string;
  /** HTML-Spiele werden immer als ZIP-Dateipaket gepflegt. */
  kind: 'html';
  files: GameFile[];
  maxPoints: number;
  apiVersion: 1;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Session = { playerId: ID; startedAt: string; isAdmin: boolean };
```

**Storage-Layout**

| Key | Inhalt |
|---|---|
| `ntk:v1:meta` | `{ seedVersion, createdAt, lastResetAt }` |
| `ntk:v1:session` | aktive Spieler-Session |
| `ntk:v1:players` | `Player[]` |
| `ntk:v1:modules` | `Module[]` |
| `ntk:v1:quizzes` | `Quiz[]` |
| `ntk:v1:games` | `Game[]` |
| `ntk:v1:scores` | `Score[]` (max. 500, FIFO) |

> Bei `seedVersion`-Mismatch oder leerem Storage werden Demo-Daten geladen. „Demo-Daten zurücksetzen" in den Einstellungen löscht alle `ntk:v1:*`-Keys und seedet neu.

---

## 4. Routen

```
/                          Anmeldung (Name + Avatar)                [Spieler]
/lernen                    Dashboard: Module, Punkte, Bestenliste
/lernen/[moduleId]         Modul-Detail mit Stationen
/quiz/[quizId]             Quiz-Player (MC, R/F, Bild, Zuordnung)
/spielen/[gameId]          Spiel-Host (iframe + Bridge)
/ergebnis/[refType]/[id]   Ergebnis-Screen

/admin                     Dashboard (KPIs, letzte Änderungen)      [Admin, fake]
/admin/spiele              Gemeinsame Spiele-Liste (Quizze + HTML-Spiele)
/admin/quiz/[id]           Quiz-Editor: Grundeinstellungen → Fragen
/admin/spiele/[id]         HTML-Spiel-Editor: ZIP-Upload → Dateien & Vorschau
/admin/api                 Spiel-API v1, Bridge-Snippet und KI-Skill (Link im ZIP-Editor)
/admin/spieler             Spieler & Scores
/admin/mediathek           Bild-Platzhalter-Galerie
/admin/einstellungen       Branding, Punkte, Reset
```

`/admin/quiz` und `/admin/import` leiten auf die gemeinsame Spiele-Liste um. „Neues Spiel“ bietet dort fünf gleichwertige Einstiege: Multiple Choice, Richtig/Falsch, Bilderrätsel, Zuordnung und HTML-Spiel (ZIP).

---

## 5. postMessage-Protokoll v1

Gültig für **jedes** Spiel, egal ob importiert oder im Editor gebaut.

### Host → Spiel

```ts
type HostMessage =
  | { source: 'ntk-platform'; type: 'INIT'; apiVersion: 1; payload: {
        player: { id: string; name: string; avatar: string };
        game:   { id: string; title: string; maxPoints: number };
        theme:  { mode: 'light'; primary: string };
        locale: 'de-DE';
      } }
  | { source: 'ntk-platform'; type: 'PAUSE' }
  | { source: 'ntk-platform'; type: 'RESUME' }
  | { source: 'ntk-platform'; type: 'RESET' };
```

### Spiel → Host

```ts
type GameMessage =
  | { source: 'ntk-game'; type: 'READY' }
  | { source: 'ntk-game'; type: 'SCORE';  payload: { points: number; maxPoints?: number } }
  | { source: 'ntk-game'; type: 'COMPLETE'; payload: { points: number; maxPoints: number; durationMs?: number } }
  | { source: 'ntk-game'; type: 'RESIZE'; payload: { height: number } }
  | { source: 'ntk-game'; type: 'STATE';  payload: { label: string } }   // optional, für Host-Anzeige
  | { source: 'ntk-game'; type: 'LOG';    payload: { level: 'info'|'warn'|'error'; message: string } };
```

**Regeln**

1. Host sendet `INIT` erst nach `iframe.onload` **und** nach Empfang von `READY` (mit 1 s Timeout-Fallback).
2. `targetOrigin = '*'` (srcdoc hat `origin: "null"`); Validierung erfolgt über `event.source === iframe.contentWindow` **und** `source`-Feld.
3. `SCORE` aktualisiert nur die Live-Anzeige; `COMPLETE` persistiert den Score.
4. Unbekannte `type`-Werte werden geloggt, aber nicht geworfen.
5. Editor bekommt eine **Bridge-Konsole** (Message-Log + Button „INIT erneut senden").
6. Spiele-Template wird im Editor als Copy-Paste-Snippet angeboten (siehe `game-template.ts`).

---

## 6. Beispielinhalte (Seed)

**Modul 1 – „Milchkuh & Klima"** (FBN-Thema: Emissionen, Fütterung, Tierwohl)

- Quiz „Was weißt du über Methan?" – 6 Fragen, gemischt:
  - MC: „Wodurch entsteht im Pansen der Kühe vor allem Methan?" (3 Antworten)
  - R/F: „Eine Kuh stößt pro Tag mehr CO₂-Äquivalente aus als ein Kleinwagen auf 100 km." (mit Erklärtext)
  - Bilderrätsel: Foto/Emoji „Welches Futter reduziert Methan?" (Auswahl)
  - Zuordnung: 4 Begriffe → 4 Kategorien (Futter / Verdauung / Emission / Messung)
- Spiel „Pansen-Puzzle" (Code-Beispiel, ~80 Zeilen HTML/JS) – Drag-free Klick-Spiel, meldet `SCORE`/`COMPLETE`.

**Modul 2 – „Schwein & Stallklima"** (Platzhalter, 1 Quiz)
**Modul 3 – „Geflügel & Verhalten"** (Platzhalter, 0 Inhalte → Empty State zeigen)
**Modul 4 – „Präzisionslandwirtschaft"** (Platzhalter)

**Demo-Spieler:** Lena (🦊), Jonas (🐻), Mia (🦉), Emre (🐺), Frau Weber (👩‍🏫, Lehrkraft-Demo).

---

## 7. Dateistruktur

```
src/
  app.css                      ← Design-Tokens + Tailwind + Material Symbols
  app.html
  lib/
    types.ts
    utils/id.ts | format.ts | validate.ts
    storage/db.ts | seed.ts | reset.ts
    stores/session.svelte.ts | content.svelte.ts | scores.svelte.ts | toast.svelte.ts
    bridge/protocol.ts | host.ts
    games/seed-games.ts | game-template.ts
    components/
      ui/        Button Card Badge Modal Toast Field Toggle Tabs ProgressRing EmptyState
      player/    ModuleCard StationRow AnswerOption FeedbackBox MatchBoard ScoreRing
      admin/     AdminShell Sidebar KpiCard DataTable CodePane PreviewFrame BridgeLog
  routes/
    +layout.svelte  +page.svelte
    lernen/…  quiz/…  spielen/…  ergebnis/…
    admin/+layout.svelte  admin/… (siehe §4)
  static/
docs/
  PLAN.md
  DESIGN-BRIEF-CLAUDE.md
```

---

## 8. Phasen

### Phase 0 – Design-Brief für Claude Design ⬅️ **jetzt**
- `docs/DESIGN-BRIEF-CLAUDE.md` schreiben (Screens, Komponenten, Buttons, Copy, Mock-Daten, Output-Format).
- Ergebnis: ein `design.html` vom Nutzer → Grundlage für Phase 1.
- **Fertig wenn:** Brief ist copy-paste-fertig, alle Screens + Zustände beschrieben, Rückgabedatei klar definiert.

### Phase 1 – Design-Port & Grundgerüst
- `design.html` in Svelte-Struktur übertragen: Tokens in `app.css`, Layout-Shells (`+layout.svelte` für Spieler/Admin), UI-Primitives.
- Routing-Stubs für alle Routen aus §4.
- **Fertig wenn:** alle Screens navigierbar, `npm run build` grün, responsive 390/768/1440.

### Phase 2 – Storage & Session
- `db.ts` (get/set/subscribe, Quota-Fehler abfangen), `seed.ts`, Reset.
- Session-Store (Name/Avatar), „Abmelden", Fake-Admin-Session.
- **Fertig wenn:** Reload behält Spieler + Inhalte; Reset funktioniert.

### Phase 3 – Spieler-Flow
- Dashboard (Module, Punkte, Bestenliste), Modul-Detail, Ergebnis-Screen.
- **Fertig wenn:** Punkte aus Quiz/Spiel erscheinen korrekt, Bestenliste sortiert.

### Phase 4 – Quiz-Player + 4 Fragetypen
- MC, Richtig/Falsch, Bilderrätsel (Choice + Input), Zuordnung (Klick-Paare).
- Sofort-Feedback inkl. Erklärtext, Punktevergabe, Fortschritt, Abschluss.
- **Fertig wenn:** alle 4 Typen spielbar, Score wird persistiert.

### Phase 5 – Quiz-Editor (No-Code-CMS)
- Zwei Screens: Grundeinstellungen (Titel, Modul, Beschreibung, Timer, Veröffentlichung) und Inhaltseditor (Fragenliste, Typwechsel, Duplizieren, Löschen, Vorschau).
- **Fertig wenn:** ein neues Quiz ist ohne Code erstellbar und sofort spielbar.

### Phase 6 – Spiele: ZIP-Editor, Bridge, API-Doku
- HTML-Spiel-Editor mit ZIP-Upload, Datei-Explorer, Texteditor für HTML/CSS/JS, Medienvorschau und Live-iframe inkl. Bridge-Log.
- Dateitypen-Prüfung (nur HTML, CSS, JS, Bilder, Audio, Video), Größenlimits, Asset-Inlining für `srcdoc`, Sandbox-Härtung, Protokoll-Validierung.
- Copy-Paste-Bridge-Snippet, KI-Skill und API-Dokumentation unter `/admin/api` und `docs/GAME-API.md`.
- **Fertig wenn:** Beispielspiel meldet Name korrekt an, Score kommt zurück, ZIP-Paket läuft isoliert, blockierte Dateien werden gemeldet.

### Phase 7 – Feinschliff
- Empty States, Toasts, Unsaved-Changes-Guard, Tastaturbedienung, Fokus-Ringe, `prefers-reduced-motion`, mobile Politur.
- **Fertig wenn:** `npm run check` + `npm run build` grün, Lighthouse-A11y ≥ 95 (Demo-Niveau).

---

## 9. Risiken & Gegenmaßnahmen

| Risiko | Maßnahme |
|---|---|
| `localStorage` voll (5 MB) bei Bild-Data-URLs | Bilder auf max. 300 KB begrenzen, Warnung + Kompression via Canvas |
| Eingebettetes HTML enthält feindseliges JS | `sandbox="allow-scripts allow-forms"` ohne `allow-same-origin`, keine Host-Cookies |
| Design-HTML weicht stark von Svelte-Struktur ab | Brief verlangt `data-screen` / `data-action` + Tailwind-Utilities, keine eigenen Build-Tools |
| postMessage-Spam / fremde Fenster | `event.source`-Check + `source`-Feld + Schema-Validierung |
| Verwirrung „echter Login" | sichtbares Badge „Demo-Modus" in Admin-Topbar |

---

## 10. Offene Punkte (nach Design-Rückgabe klären)

1. Soll die Bestenliste global oder pro Modul sein? → Vorschlag: global mit Filter.
2. Braucht das Quiz einen Timer? → Vorschlag: optional pro Quiz, Default aus.
3. Avatar-Auswahl: Emoji (kein Upload) ok? → Vorschlag: ja für Demo.
4. Sollen importierte Spiele bearbeitbar sein? → Vorschlag: ja, HTML landet im selben Editor.
