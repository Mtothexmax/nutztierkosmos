# Spiel-API v1 – Nutztierkosmos

Diese Dokumentation beschreibt, wie HTML-Spiele im iframe mit der Plattform kommunizieren. Sie ist außerdem im CMS unter **Spiele → API-Doku** einsehbar und enthält dort Copy-Buttons.

## Prinzip

- Jedes Spiel läuft in einem `<iframe>` mit `sandbox="allow-scripts allow-forms allow-popups"`.
- Es gibt **kein** `allow-same-origin`: kein `localStorage`, keine Cookies, kein Zugriff auf das Eltern-DOM.
- Kommunikation ausschließlich über `postMessage`.
- Jede Nachricht trägt ein `source`-Feld:
  - Spiel → Plattform: `source: "ntk-game"`
  - Plattform → Spiel: `source: "ntk-platform"`

## Nachrichten

### Plattform → Spiel

| Typ | Payload | Bedeutung |
| --- | --- | --- |
| `INIT` | `{ player: { id, name, avatar }, game: { id, title, maxPoints } }` | Nach dem Laden; das Spiel antwortet mit `READY`. |
| `PAUSE` | `{}` | Spiel pausieren. |
| `RESUME` | `{}` | Spiel fortsetzen. |
| `RESET` | `{}` | Spiel zurücksetzen. |

### Spiel → Plattform

| Typ | Payload | Bedeutung |
| --- | --- | --- |
| `READY` | `{}` | Spiel ist geladen und bereit. |
| `SCORE` | `{ points, maxPoints }` | Zwischenstand melden. |
| `COMPLETE` | `{ points, maxPoints, durationMs }` | Spiel beenden; Ergebnis wird gespeichert. |
| `RESIZE` | `{ height }` | Optionale Höhe melden. |
| `STATE` | `{ state }` | Optionaler Zwischenstand für die Konsole. |
| `LOG` | `{ level, message }` | Optionale Debug-Ausgabe. |

## Bridge-Skript

```js
const send = (type, payload = {}) =>
  parent.postMessage({ source: 'ntk-game', type, payload }, '*');

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.source !== 'ntk-platform') return;

  if (data.type === 'INIT') {
    // data.payload.player.name, data.payload.game.maxPoints
    send('READY');
  }
  if (data.type === 'PAUSE') { /* pausieren */ }
  if (data.type === 'RESUME') { /* fortsetzen */ }
  if (data.type === 'RESET') { /* zurücksetzen */ }
});

send('SCORE', { points: 40, maxPoints: 100 });
send('COMPLETE', { points: 100, maxPoints: 100, durationMs: 42000 });
send('READY');
```

## ZIP-Paket

- Startseite: `index.html` (auch in einem Unterordner, dann wird die kürzeste HTML-Datei gewählt).
- Erlaubte Dateitypen: `.html`, `.htm`, `.css`, `.js`, `.mjs`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.avif`, `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.mp4`, `.webm`, `.ogv`.
- Grenzen: 5 MB entpackt, 150 Dateien.
- Nicht erlaubte Dateien (z. B. `.exe`, `.swf`, `.php`) werden nicht übernommen und im Editor gemeldet.
- CSS-, JS- und Medienverweise werden beim Start automatisch in das HTML eingebettet. Relative Pfade funktionieren; externe URLs werden nicht aufgelöst.
- `__MACOSX`, `.DS_Store` und `Thumbs.db` werden ignoriert.

## Einstellungen: `game.json` (Pflicht)

Jedes Paket enthält im Stammordner eine `game.json` mit den Grundeinstellungen. Beim Upload im CMS
werden sie übernommen; beim Build wird ein Paket ohne Einstellungen abgelehnt.

```json
{
  "id": "g-heisser-tag",
  "title": "Ein heißer Tag auf der Weide",
  "description": "Ein bis zwei Sätze: worum es geht und wie lange es dauert.",
  "lang": "de",
  "topic": "rind/hitzestress",
  "maxPoints": 1000,
  "triggerWarning": true,
  "published": true,
  "version": "1.0.0"
}
```

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `id` | ja | Stabile Kennung (`a–z`, `0–9`, `-`). Bei neuen Versionen nicht ändern. |
| `title`, `description` | Titel ja | Wie auf der Website angezeigt. |
| `lang`, `translationOf` | – | `"de"`/`"en"`; bei Übersetzungen die `id` des Originals. |
| `topic` (oder `topicId`) | ja | Themenschwerpunkt als `kategorie/thema`, z. B. `rind/hitzestress`. Entscheidet, wo das Spiel erscheint. |
| `maxPoints` | ja | Höchstpunktzahl, passend zu `SCORE`/`COMPLETE`. |
| `triggerWarning` | – | Epilepsie-Hinweis vor dem Start (Standard `true`). |
| `published` | – | Standard `true`. |
| `version` | – | Freie Versionsangabe. |

Die Prüfregeln stehen in `src/lib/games/package-rules.js` und gelten für Build und CMS gleich.

## Spiele im Projekt: Ordner `games/`

- Alle ZIPs in `games/` werden bei `npm run dev` und `npm run build` geprüft und in der App als Spiele angelegt
  (`npm run games` macht das einzeln). Fehlerhafte Pakete brechen den Build mit einer klaren Meldung ab.
- Eine gleichnamige `.json` **neben** dem ZIP (z. B. `games/Mein-Spiel.json`) überschreibt einzelne Felder
  der `game.json` – für Anpassungen durch die Redaktion, ohne das ZIP neu zu bauen.
- **Neueste Version holen:** In `package.json` unter `nutztierkosmos.gameSources` stehen Quellen (ZIP-Datei
  oder Ordner – dann gilt das jüngste ZIP darin). Ist die Quelle neuer, wird das ZIP nach `games/` kopiert.
  Fehlt die Quelle (anderer Rechner), wird sie übersprungen. Alternativ: Umgebungsvariable `NTK_GAME_SOURCES`
  (mehrere Pfade mit `;`).
- Ändert sich ein ZIP oder seine Einstellungen, übernimmt die App das Spiel beim nächsten Laden neu.
  Maßgeblich ist dann der Ordner: Änderungen an diesem Spiel im CMS werden dabei überschrieben.

## KI-Skill (Copy-Paste)

```text
Du baust ein HTML5-Spiel für die Lernplattform „Nutztierkosmos“. Gib mir ein vollständiges ZIP-Paket mit einer index.html, einer game.json (Einstellungen, siehe unten) und optional CSS-, JS-, Bild-, Audio- oder Video-Dateien.

## Technische Umgebung
- Das Spiel läuft in einem iframe mit sandbox="allow-scripts allow-forms allow-popups".
- Es gibt KEIN allow-same-origin: kein localStorage, keine Cookies, kein Zugriff auf das Eltern-Dokument.
- Das Spiel muss vollständig eigenständig funktionieren. Externe Netzwerk-Aufrufe sind nicht erlaubt.
- Erlaubte Dateien: .html, .htm, .css, .js, .mjs, .png, .jpg, .jpeg, .gif, .webp, .svg, .avif, .mp3, .wav, .ogg, .m4a, .aac, .mp4, .webm, .ogv.
- Alle Pfade sind relativ. Die Startseite muss index.html heißen.
- Maximal 5 MB entpackt (auch eine einzelne Datei darf bis zu 5 MB groß sein).
- Zusätzlich erlaubt: genau eine game.json im Stammordner.

## Pflicht: Einstellungen in game.json
Lege in den Stammordner des ZIPs (neben index.html) eine Datei game.json mit den Grundeinstellungen. Ohne sie wird das Paket beim Build abgelehnt.

{
  "id": "g-heisser-tag",
  "title": "Ein heißer Tag auf der Weide",
  "description": "Ein bis zwei Sätze: worum es geht und wie lange es dauert.",
  "lang": "de",
  "topic": "rind/hitzestress",
  "maxPoints": 1000,
  "triggerWarning": true,
  "published": true,
  "version": "1.0.0"
}

Felder:
- id (Pflicht): stabile Kennung, nur a–z, 0–9 und Bindestrich, z. B. "g-mein-spiel". Bei neuen Versionen NICHT ändern.
- title (Pflicht), description: Titel und Kurzbeschreibung, wie sie auf der Website erscheinen.
- lang: "de" oder "en" (Standard "de"). Für eine Übersetzung zusätzlich "translationOf": "<id des Originals>".
- topic (Pflicht): Themenschwerpunkt als "kategorie/thema", z. B. "rind/hitzestress", "rind/methan-und-fuetterung", "rind/sensoren-im-stall", "schwein/stallklima", "schwein/beschaeftigung", "gefluegel/verhalten-von-legehennen", "gefluegel/futter-und-gesundheit".
- maxPoints (Pflicht): Höchstpunktzahl; muss zu SCORE und COMPLETE passen.
- triggerWarning: true, wenn Blitze, schnelle Bewegungen oder Lichteffekte vorkommen (Standard true).
- published: Standard true. version: frei, z. B. "1.2.0".

## postMessage-API v1
Alle Nachrichten haben das Feld source.
Spiel -> Plattform: { source: 'ntk-game', type: '...', payload: {...} }
Plattform -> Spiel: { source: 'ntk-platform', type: '...', payload: {...} }

Plattform -> Spiel:
- INIT: { player: { id, name, avatar }, game: { id, title, maxPoints } }
- PAUSE, RESUME, RESET: jeweils {}

Spiel -> Plattform:
- READY: {} – sofort nach dem Laden UND nach INIT senden
- SCORE: { points, maxPoints } – bei jedem Zwischenstand
- COMPLETE: { points, maxPoints, durationMs } – einmal am Ende
- RESIZE: { height } – optional
- STATE: { state } – optional
- LOG: { level, message } – optional

## Anforderungen
1. Zeige den Spielernamen aus INIT im Spiel an.
2. Reagiere auf PAUSE, RESUME und RESET sinnvoll.
3. Melde den Punktestand per SCORE und das Endergebnis per COMPLETE.
4. Kein localStorage, keine Cookies, keine externen Skripte oder Schriften.
5. Responsive Layout, gut bedienbar per Tastatur, ausreichender Farbkontrast.
6. Das Spiel soll inhaltlich zum FBN-Forschungsthema Nutztierhaltung passen.
7. Lege immer die game.json mit den Grundeinstellungen bei; maxPoints muss zu SCORE und COMPLETE passen.
8. Gib am Ende die komplette Dateistruktur und jeden Dateiinhalt aus (inklusive game.json), sodass ich daraus ein ZIP bauen kann.
```
