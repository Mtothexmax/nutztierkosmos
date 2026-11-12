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
		payload: '{ player: { id, name, avatar }, game: { id, title, maxPoints }, locale }',
		description:
			'Wird nach dem Laden gesendet. locale ist "de" oder "en" – in dieser Sprache soll das Spiel laufen. Das Spiel antwortet mit READY.'
	},
	{
		direction: 'host',
		type: 'LOCALE',
		payload: '{ locale }',
		description: 'Sprache während des Spiels gewechselt ("de" oder "en"). Texte umschalten, Spielstand behalten.'
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

// Alle Texte des Spiels auf Deutsch und Englisch
const TEXTS = {
  de: { start: 'Spiel starten', score: 'Punkte' },
  en: { start: 'Start game', score: 'Points' }
};
let locale = 'de';
const t = (key) => TEXTS[locale][key] ?? TEXTS.de[key];
function setLocale(next) {
  locale = next === 'en' ? 'en' : 'de';
  document.documentElement.lang = locale;
  // sichtbare Texte neu setzen, z. B. button.textContent = t('start');
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.source !== 'ntk-platform') return;

  if (data.type === 'INIT') {
    // data.payload.player.name, data.payload.game.maxPoints
    setLocale(data.payload.locale); // "de" oder "en"
    send('READY');
  }
  if (data.type === 'LOCALE') setLocale(data.payload.locale);
  if (data.type === 'PAUSE') { /* pausieren */ }
  if (data.type === 'RESUME') { /* fortsetzen */ }
  if (data.type === 'RESET') { /* zurücksetzen */ }
});

// Zwischenstand und Endergebnis
send('SCORE', { points: 40, maxPoints: 100 });
send('COMPLETE', { points: 100, maxPoints: 100, durationMs: 42000 });

// Ganz am Anfang einmal melden, dass das Spiel geladen ist
send('READY');`;

export const skillPrompt = `Du baust ein HTML5-Spiel für die Lernplattform „Nutztierkosmos“. Gib mir ein vollständiges ZIP-Paket mit einer index.html, einer game.json (Einstellungen, siehe unten) und optional CSS-, JS-, Bild-, Audio- oder Video-Dateien.

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
  "title": { "de": "Ein heißer Tag auf der Weide", "en": "A hot day in the pasture" },
  "description": {
    "de": "Ein bis zwei Sätze: worum es geht und wie lange es dauert.",
    "en": "One or two sentences: what it is about and how long it takes."
  },
  "languages": ["de", "en"],
  "topic": "rind/hitzestress",
  "maxPoints": 1000,
  "triggerWarning": true,
  "published": true,
  "version": "1.0.0"
}

Felder:
- id (Pflicht): stabile Kennung, nur a–z, 0–9 und Bindestrich, z. B. "g-mein-spiel". Bei neuen Versionen NICHT ändern.
- title (Pflicht), description: Titel und Kurzbeschreibung, wie sie auf der Website erscheinen – jeweils als { "de": "…", "en": "…" }. Deutsch ist Pflicht.
- languages: Sprachen, die das Spiel selbst kann: ["de", "en"] (Standard ["de"]). Es gibt EIN Paket für beide Sprachen, keine getrennten Übersetzungs-Pakete.
- topic (Pflicht): Themenschwerpunkt als "kategorie/thema", z. B. "rind/hitzestress", "rind/methan-und-fuetterung", "rind/sensoren-im-stall", "schwein/stallklima", "schwein/beschaeftigung", "gefluegel/verhalten-von-legehennen", "gefluegel/futter-und-gesundheit".
- maxPoints (Pflicht): Höchstpunktzahl; muss zu SCORE und COMPLETE passen.
- triggerWarning: true, wenn Blitze, schnelle Bewegungen oder Lichteffekte vorkommen (Standard true).
- published: Standard true. version: frei, z. B. "1.2.0".

## postMessage-API v1
Alle Nachrichten haben das Feld source.
Spiel -> Plattform: { source: 'ntk-game', type: '...', payload: {...} }
Plattform -> Spiel: { source: 'ntk-platform', type: '...', payload: {...} }

Plattform -> Spiel:
- INIT: { player: { id, name, avatar }, game: { id, title, maxPoints }, locale } – locale ist "de" oder "en"
- LOCALE: { locale } – die Sprache wurde während des Spiels gewechselt ("de" oder "en")
- PAUSE, RESUME, RESET: jeweils {}

Spiel -> Plattform:
- READY: {} – sofort nach dem Laden UND nach INIT senden
- SCORE: { points, maxPoints } – bei jedem Zwischenstand
- COMPLETE: { points, maxPoints, durationMs } – einmal am Ende
- RESIZE: { height } – optional
- STATE: { state } – optional
- LOG: { level, message } – optional

## Sprachen (Deutsch und Englisch)
- Das Spiel ist ein einziges Paket für Deutsch und Englisch. Lege alle sichtbaren Texte (Buttons, Anleitungen, Rückmeldungen, Alternativtexte, Untertitel) in beiden Sprachen an, z. B. in einem Objekt TEXTS = { de: {...}, en: {...} }.
- Die Sprache kommt per postMessage: INIT.payload.locale ("de" oder "en"). Starte in dieser Sprache. Bis INIT eintrifft, gilt Deutsch.
- Auf LOCALE { locale } schaltest du alle Texte sofort um, ohne den Spielstand zurückzusetzen.
- Setze document.documentElement.lang auf die aktuelle Sprache (für Screenreader).
- Trage in game.json "languages": ["de", "en"] ein. Kann das Spiel nur eine Sprache, trage nur diese ein – die Plattform schickt dann immer diese Sprache.

## Anforderungen
1. Zeige den Spielernamen aus INIT im Spiel an.
2. Reagiere auf PAUSE, RESUME und RESET sinnvoll.
3. Melde den Punktestand per SCORE und das Endergebnis per COMPLETE.
4. Kein localStorage, keine Cookies, keine externen Skripte oder Schriften.
5. Responsive Layout, gut bedienbar per Tastatur, ausreichender Farbkontrast.
6. Das Spiel soll inhaltlich zum FBN-Forschungsthema Nutztierhaltung passen.
7. Lege immer die game.json mit den Grundeinstellungen bei (Titel und Beschreibung auf Deutsch und Englisch); maxPoints muss zu SCORE und COMPLETE passen.
8. Alle Texte auf Deutsch und Englisch; Sprache aus INIT.payload.locale übernehmen und auf LOCALE umschalten.
9. Gib am Ende die komplette Dateistruktur und jeden Dateiinhalt aus (inklusive game.json), sodass ich daraus ein ZIP bauen kann.`;
