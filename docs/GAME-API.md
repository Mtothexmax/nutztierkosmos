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
- Grenzen: 2,5 MB entpackt, 1,5 MB pro Datei, 150 Dateien.
- Nicht erlaubte Dateien (z. B. `.exe`, `.swf`, `.php`) werden nicht übernommen und im Editor gemeldet.
- CSS-, JS- und Medienverweise werden beim Start automatisch in das HTML eingebettet. Relative Pfade funktionieren; externe URLs werden nicht aufgelöst.
- `__MACOSX`, `.DS_Store` und `Thumbs.db` werden ignoriert.

## KI-Skill (Copy-Paste)

```text
Du baust ein HTML5-Spiel für die Lernplattform „Nutztierkosmos“. Gib mir ein vollständiges ZIP-Paket mit einer index.html und optional CSS-, JS-, Bild-, Audio- oder Video-Dateien.

Technische Umgebung:
- Das Spiel läuft in einem iframe mit sandbox="allow-scripts allow-forms allow-popups".
- Kein allow-same-origin: kein localStorage, keine Cookies, kein Zugriff auf das Eltern-Dokument.
- Das Spiel muss vollständig eigenständig funktionieren. Externe Netzwerk-Aufrufe sind nicht erlaubt.
- Erlaubte Dateien: .html, .htm, .css, .js, .mjs, .png, .jpg, .jpeg, .gif, .webp, .svg, .avif, .mp3, .wav, .ogg, .m4a, .aac, .mp4, .webm, .ogv.
- Alle Pfade sind relativ. Die Startseite muss index.html heißen.
- Maximal 2,5 MB entpackt, maximal 1,5 MB pro Datei.

postMessage-API v1:
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

Anforderungen:
1. Zeige den Spielernamen aus INIT im Spiel an.
2. Reagiere auf PAUSE, RESUME und RESET sinnvoll.
3. Melde den Punktestand per SCORE und das Endergebnis per COMPLETE.
4. Kein localStorage, keine Cookies, keine externen Skripte oder Schriften.
5. Responsive Layout, gut bedienbar per Tastatur, ausreichender Farbkontrast.
6. Das Spiel soll inhaltlich zum FBN-Forschungsthema Nutztierhaltung passen.
7. Gib am Ende die komplette Dateistruktur und jeden Dateiinhalt aus, sodass ich daraus ein ZIP bauen kann.
```
