export type ApiMessage = {
	direction: 'host' | 'game';
	type: string;
	payload: string;
	description: string;
};

export const apiMessages: ApiMessage[] = [
	{
		direction: 'host',
		type: 'INIT',
		payload: '{ player: { id, name, avatar }, game: { id, title, maxPoints } }',
		description: 'Wird nach dem Laden gesendet. Das Spiel antwortet mit READY.'
	},
	{ direction: 'host', type: 'PAUSE', payload: '{}', description: 'Spiel pausieren.' },
	{ direction: 'host', type: 'RESUME', payload: '{}', description: 'Spiel fortsetzen.' },
	{ direction: 'host', type: 'RESET', payload: '{}', description: 'Spiel zurücksetzen.' },
	{ direction: 'game', type: 'READY', payload: '{}', description: 'Spiel ist bereit und hat INIT erhalten.' },
	{
		direction: 'game',
		type: 'SCORE',
		payload: '{ points, maxPoints }',
		description: 'Zwischenstand melden. Die Plattform zeigt den Score live an.'
	},
	{
		direction: 'game',
		type: 'COMPLETE',
		payload: '{ points, maxPoints, durationMs }',
		description: 'Spiel beendet. Das Ergebnis wird gespeichert.'
	},
	{ direction: 'game', type: 'RESIZE', payload: '{ height }', description: 'Optionale Höhe des Spiels melden.' },
	{ direction: 'game', type: 'STATE', payload: '{ state }', description: 'Optionaler Zwischenstand für die Konsole.' },
	{
		direction: 'game',
		type: 'LOG',
		payload: '{ level, message }',
		description: 'Optionale Debug-Ausgabe in der Bridge-Konsole.'
	}
];

export const bridgeSnippet = `// In dein Spiel einbauen – z. B. am Ende von index.html
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

// Zwischenstand und Endergebnis
send('SCORE', { points: 40, maxPoints: 100 });
send('COMPLETE', { points: 100, maxPoints: 100, durationMs: 42000 });

// Ganz am Anfang einmal melden, dass das Spiel geladen ist
send('READY');`;

export const skillPrompt = `Du baust ein HTML5-Spiel für die Lernplattform „Nutztierkosmos“. Gib mir ein vollständiges ZIP-Paket mit einer index.html und optional CSS-, JS-, Bild-, Audio- oder Video-Dateien.

## Technische Umgebung
- Das Spiel läuft in einem iframe mit sandbox="allow-scripts allow-forms allow-popups".
- Es gibt KEIN allow-same-origin: kein localStorage, keine Cookies, kein Zugriff auf das Eltern-Dokument.
- Das Spiel muss vollständig eigenständig funktionieren. Externe Netzwerk-Aufrufe sind nicht erlaubt.
- Erlaubte Dateien: .html, .htm, .css, .js, .mjs, .png, .jpg, .jpeg, .gif, .webp, .svg, .avif, .mp3, .wav, .ogg, .m4a, .aac, .mp4, .webm, .ogv.
- Alle Pfade sind relativ. Die Startseite muss index.html heißen.
- Maximal 2,5 MB entpackt, maximal 1,5 MB pro Datei.

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
7. Gib am Ende die komplette Dateistruktur und jeden Dateiinhalt aus, sodass ich daraus ein ZIP bauen kann.`;
