// @ts-check
/**
 * Regeln für Spielpakete (ZIP) – gemeinsam genutzt vom Build-Skript
 * (scripts/sync-games.mjs, Node) und vom Browser (ZIP-Upload im CMS).
 * Bewusst reines JavaScript, damit beide Seiten exakt dieselbe Prüfung haben.
 */

/** Name der Einstellungsdatei im Stammordner des ZIPs. */
export const MANIFEST_FILE = 'game.json';

/** 5 MB entpackt; auch eine einzelne Datei darf so groß sein. */
export const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 150;

export const ALLOWED_EXTENSIONS = [
	'html', 'htm', 'css', 'js', 'mjs',
	'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif',
	'mp3', 'wav', 'ogg', 'm4a', 'aac',
	'mp4', 'webm', 'ogv'
];

/**
 * @typedef {object} GameManifest
 * @property {string} id            Stabile Kennung, z. B. "g-heisser-tag" (Kleinbuchstaben, Ziffern, Bindestrich).
 * @property {{ de: string, en?: string }} title   Titel auf Deutsch (Pflicht) und Englisch.
 * @property {{ de: string, en?: string }} description Kurzbeschreibung auf Deutsch und Englisch.
 * @property {('de'|'en')[]} languages Sprachen, die das Spiel selbst kann (Standard: ["de"]).
 *                                  Die Plattform schickt die passende im INIT (payload.locale).
 * @property {string} [topic]       Themenschwerpunkt als "kategorie/thema", z. B. "rind/hitzestress".
 * @property {string} [topicId]     Alternativ die interne ID des Themas.
 * @property {number} maxPoints     Höchstpunktzahl (> 0), muss zu SCORE/COMPLETE passen.
 * @property {boolean} [triggerWarning] Epilepsie-Hinweis vor dem Start (Standard: true).
 * @property {boolean} [published]  Öffentlich sichtbar (Standard: true für Pakete aus games/).
 * @property {string} [version]     Freie Versionsangabe, z. B. "1.2.0".
 */

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;
const KNOWN_KEYS = new Set([
	'$schema', 'id', 'title', 'description', 'languages', 'topic', 'topicId',
	'maxPoints', 'triggerWarning', 'published', 'version', 'apiVersion',
	// veraltet, wird noch gelesen:
	'lang'
]);

const LOCALES = ['de', 'en'];

/**
 * Text auf Deutsch und Englisch: { "de": "…", "en": "…" }. Ein einfacher String gilt als Deutsch.
 * @param {unknown} value
 * @returns {{ de: string, en: string } | null} null, wenn die Form nicht stimmt
 */
function readL10n(value) {
	if (value === undefined) return { de: '', en: '' };
	if (typeof value === 'string') return { de: value.trim(), en: '' };
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	const v = /** @type {Record<string, unknown>} */ (value);
	if ((v.de !== undefined && typeof v.de !== 'string') || (v.en !== undefined && typeof v.en !== 'string')) return null;
	return { de: typeof v.de === 'string' ? v.de.trim() : '', en: typeof v.en === 'string' ? v.en.trim() : '' };
}

/**
 * Prüft und normalisiert eine game.json (ggf. zusammengeführt mit der Datei neben dem ZIP).
 * @param {unknown} raw
 * @returns {{ manifest: GameManifest | null, errors: string[], warnings: string[] }}
 */
export function validateManifest(raw) {
	/** @type {string[]} */ const errors = [];
	/** @type {string[]} */ const warnings = [];
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return { manifest: null, errors: [`${MANIFEST_FILE} muss ein JSON-Objekt sein.`], warnings };
	}
	const m = /** @type {Record<string, unknown>} */ (raw);
	for (const key of Object.keys(m)) if (!KNOWN_KEYS.has(key)) warnings.push(`Unbekanntes Feld „${key}“ wird ignoriert.`);

	const str = (/** @type {string} */ key) => (typeof m[key] === 'string' ? /** @type {string} */ (m[key]).trim() : undefined);

	const id = str('id');
	if (!id) errors.push('„id“ fehlt.');
	else if (!ID_PATTERN.test(id)) errors.push(`„id“ „${id}“ ist ungültig (nur a–z, 0–9 und Bindestrich, 2–63 Zeichen).`);

	const title = readL10n(m.title);
	if (!title) errors.push('„title“ muss { "de": "…", "en": "…" } oder ein Text sein.');
	else if (!title.de) errors.push('„title“ braucht mindestens einen deutschen Titel ("de").');
	const description = readL10n(m.description);
	if (!description) errors.push('„description“ muss { "de": "…", "en": "…" } oder ein Text sein.');
	if (title && !title.en) warnings.push('„title.en“ fehlt – auf der englischen Seite erscheint der deutsche Titel.');

	const maxPoints = Number(m.maxPoints);
	if (!Number.isFinite(maxPoints) || maxPoints <= 0) errors.push('„maxPoints“ muss eine Zahl größer 0 sein.');

	/** @type {('de'|'en')[]} */ let languages = ['de'];
	if (m.languages !== undefined) {
		if (!Array.isArray(m.languages) || !m.languages.length || m.languages.some((l) => !LOCALES.includes(l))) {
			errors.push('„languages“ muss eine Liste aus "de" und/oder "en" sein, z. B. ["de", "en"].');
		} else languages = /** @type {('de'|'en')[]} */ ([...new Set(m.languages)]);
	} else if (m.lang !== undefined) {
		// Altes Format: eine Sprache pro Paket.
		const lang = str('lang');
		if (lang !== 'de' && lang !== 'en') errors.push('„lang“ muss "de" oder "en" sein.');
		else languages = [lang];
		warnings.push('„lang“ ist veraltet – bitte „languages“ verwenden, z. B. ["de", "en"].');
	}

	const topic = str('topic');
	const topicId = str('topicId');
	if (!topic && !topicId) errors.push('„topic“ (z. B. "rind/hitzestress") oder „topicId“ fehlt.');
	if (topic && !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(topic)) errors.push(`„topic“ „${topic}“ muss die Form "kategorie/thema" haben.`);

	for (const key of ['triggerWarning', 'published']) {
		if (m[key] !== undefined && typeof m[key] !== 'boolean') errors.push(`„${key}“ muss true oder false sein.`);
	}
	if (m.apiVersion !== undefined && m.apiVersion !== 1) errors.push('„apiVersion“ muss 1 sein.');

	if (errors.length) return { manifest: null, errors, warnings };
	return {
		manifest: {
			id: /** @type {string} */ (id),
			title: /** @type {{ de: string, en: string }} */ (title),
			description: /** @type {{ de: string, en: string }} */ (description),
			languages,
			topic,
			topicId,
			maxPoints: Math.round(maxPoints),
			triggerWarning: m.triggerWarning === undefined ? true : /** @type {boolean} */ (m.triggerWarning),
			published: m.published === undefined ? true : /** @type {boolean} */ (m.published),
			version: str('version')
		},
		errors,
		warnings
	};
}

/** Systemdateien von Packprogrammen, die stillschweigend übergangen werden. */
export function isJunkPath(/** @type {string} */ path) {
	return path.startsWith('__MACOSX/') || path.endsWith('.DS_Store') || path.endsWith('Thumbs.db');
}

/**
 * Prüft die Dateien eines Pakets (ohne game.json).
 * Nicht erlaubte Dateitypen sind kein Fehler: Sie werden ignoriert (wie beim Upload im CMS).
 * @param {{ path: string, size: number }[]} files
 * @returns {{ errors: string[], ignored: string[] }}
 */
export function validateFiles(files) {
	/** @type {string[]} */ const errors = [];
	/** @type {string[]} */ const ignored = [];
	let total = 0;
	let count = 0;
	let hasIndex = false;
	for (const file of files) {
		const ext = file.path.split('.').pop()?.toLowerCase() ?? '';
		if (!ALLOWED_EXTENSIONS.includes(ext)) {
			ignored.push(file.path);
			continue;
		}
		count += 1;
		if (file.size > MAX_FILE_BYTES) errors.push(`„${file.path}“ ist zu groß (max. 5 MB pro Datei).`);
		total += file.size;
		if (/(^|\/)index\.html?$/i.test(file.path)) hasIndex = true;
	}
	if (total > MAX_TOTAL_BYTES) errors.push('Das Paket ist zu groß (max. 5 MB entpackt).');
	if (count > MAX_FILES) errors.push(`Zu viele Dateien (max. ${MAX_FILES}).`);
	if (!hasIndex) errors.push('Es fehlt eine index.html.');
	return { errors, ignored };
}

/**
 * Findet game.json im Stammordner – oder in einem einzigen Oberordner,
 * falls das ZIP alles in einen Ordner gepackt hat (häufig bei Packprogrammen).
 * @param {string[]} paths normalisierte Pfade
 * @returns {string | undefined}
 */
export function findManifestPath(paths) {
	if (paths.includes(MANIFEST_FILE)) return MANIFEST_FILE;
	const tops = new Set(paths.map((p) => p.split('/')[0]));
	if (tops.size === 1) {
		const candidate = `${[...tops][0]}/${MANIFEST_FILE}`;
		if (paths.includes(candidate)) return candidate;
	}
	return undefined;
}
