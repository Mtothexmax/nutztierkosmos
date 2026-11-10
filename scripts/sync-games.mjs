/**
 * Spielpakete für Nutztierkosmos bereitstellen.
 *
 * 1. Holt die neueste Version jedes konfigurierten Quell-ZIPs nach games/
 *    (package.json → "nutztierkosmos.gameSources", oder Umgebungsvariable
 *    NTK_GAME_SOURCES, mehrere Pfade mit ";" getrennt). Ein Pfad kann ein ZIP
 *    oder ein Ordner sein (dann gilt das jüngste ZIP darin). Fehlt die Quelle,
 *    wird nur ein Hinweis ausgegeben – games/ bleibt, wie es ist.
 * 2. Prüft jedes ZIP in games/: Dateien (Typen, Größen, index.html) und die
 *    Einstellungen aus game.json im ZIP. Eine gleichnamige .json NEBEN dem ZIP
 *    (games/<name>.json) überschreibt einzelne Felder daraus.
 * 3. Legt die Pakete unter static/games/<id>.zip ab und schreibt die Übersicht
 *    src/lib/games/packaged.json, aus der die App die Spiele anlegt.
 *
 * Läuft automatisch bei `npm run dev` und `npm run build` (Vite-Plugin in
 * vite.config.ts). Manuell: `npm run games`.
 */
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import { findManifestPath, isJunkPath, MANIFEST_FILE, validateFiles, validateManifest } from '../src/lib/games/package-rules.js';

const root = fileURLToPath(new URL('..', import.meta.url));
export const GAMES_DIR = join(root, 'games');
const STATIC_DIR = join(root, 'static', 'games');
const INDEX_FILE = join(root, 'src', 'lib', 'games', 'packaged.json');

/** @typedef {{ info: (m: string) => void, warn: (m: string) => void, error: (m: string) => void }} Log */
/** @typedef {import('../src/lib/games/package-rules.js').GameManifest} GameManifest */

const exists = (/** @type {string} */ path) => stat(path).then(() => true, () => false);
const sha256 = (/** @type {string | NodeJS.ArrayBufferView} */ buffer) => createHash('sha256').update(buffer).digest('hex');
const message = (/** @type {unknown} */ error) => (error instanceof Error ? error.message : String(error));

/** Konfigurierte Quellen (absolut aufgelöst). */
export async function gameSources() {
	const fromEnv = process.env.NTK_GAME_SOURCES?.split(';').map((s) => s.trim()).filter(Boolean);
	/** @type {string[]} */
	let list = fromEnv ?? [];
	if (!fromEnv) {
		const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
		list = pkg.nutztierkosmos?.gameSources ?? [];
	}
	return list.map((p) => (isAbsolute(p) ? p : resolve(root, p)));
}

/**
 * Jüngstes ZIP einer Quelle (Datei oder Ordner).
 * @param {string} source
 * @returns {Promise<{ path: string, mtime: number } | null>}
 */
async function newestZip(source) {
	const info = await stat(source).catch(() => null);
	if (!info) return null;
	if (info.isFile()) return source.toLowerCase().endsWith('.zip') ? { path: source, mtime: info.mtimeMs } : null;
	/** @type {{ path: string, mtime: number } | null} */
	let best = null;
	for (const name of await readdir(source)) {
		if (!name.toLowerCase().endsWith('.zip')) continue;
		const path = join(source, name);
		const s = await stat(path);
		if (!best || s.mtimeMs > best.mtime) best = { path, mtime: s.mtimeMs };
	}
	return best;
}

/**
 * Schritt 1: neueste Quell-ZIPs nach games/ holen.
 * @param {Log} log
 */
async function pullSources(log) {
	await mkdir(GAMES_DIR, { recursive: true });
	for (const source of await gameSources()) {
		const zip = await newestZip(source);
		if (!zip) {
			log.info(`Spielquelle nicht gefunden, übersprungen: ${source}`);
			continue;
		}
		const target = join(GAMES_DIR, basename(zip.path));
		const targetInfo = await stat(target).catch(() => null);
		const [src, dst] = await Promise.all([readFile(zip.path), targetInfo ? readFile(target) : null]);
		if (dst && sha256(src) === sha256(dst)) continue;
		if (targetInfo && targetInfo.mtimeMs > zip.mtime) {
			log.warn(`games/${basename(target)} ist neuer als die Quelle – nicht überschrieben.`);
			continue;
		}
		await copyFile(zip.path, target);
		const when = new Date(zip.mtime);
		await utimes(target, when, when);
		log.info(`Neueste Version übernommen: ${basename(zip.path)} (${(src.length / 1048576).toFixed(1)} MB)`);
	}
}

/**
 * @typedef {object} Inspection
 * @property {string} name
 * @property {Buffer} [buffer]
 * @property {GameManifest | null} [manifest]
 * @property {string} [version]
 * @property {number} [fileCount]
 * @property {number} [unpackedBytes]
 * @property {string[]} [settingsFrom]
 * @property {string[]} errors
 * @property {string[]} [warnings]
 */

/**
 * Schritt 2: ein ZIP prüfen und seine Einstellungen ermitteln.
 * @param {string} zipPath
 * @returns {Promise<Inspection>}
 */
async function inspect(zipPath) {
	const name = basename(zipPath, extname(zipPath));
	const buffer = await readFile(zipPath);
	/** @type {string[]} */
	const problems = [];
	/** @type {Record<string, Uint8Array>} */
	let entries;
	try {
		entries = unzipSync(new Uint8Array(buffer));
	} catch (error) {
		return { name, errors: [`ZIP kann nicht gelesen werden: ${message(error)}`] };
	}
	const files = Object.entries(entries)
		.map(([raw, bytes]) => ({ path: raw.replace(/\\/g, '/').replace(/^\.?\/+/, ''), bytes }))
		.filter((f) => f.path && !f.path.endsWith('/') && !isJunkPath(f.path));

	const manifestPath = findManifestPath(files.map((f) => f.path));
	let inside = {};
	if (manifestPath) {
		try {
			const entry = files.find((f) => f.path === manifestPath);
			inside = JSON.parse(new TextDecoder().decode(entry?.bytes));
		} catch (error) {
			problems.push(`${MANIFEST_FILE} im ZIP ist kein gültiges JSON: ${message(error)}`);
		}
	}
	const sidecarPath = join(GAMES_DIR, `${name}.json`);
	let sidecar = {};
	let sidecarRaw = '';
	if (await exists(sidecarPath)) {
		sidecarRaw = await readFile(sidecarPath, 'utf8');
		try {
			sidecar = JSON.parse(sidecarRaw);
		} catch (error) {
			problems.push(`games/${name}.json ist kein gültiges JSON: ${message(error)}`);
		}
	}
	if (!manifestPath && !sidecarRaw) {
		problems.push(`Keine Einstellungen gefunden: ${MANIFEST_FILE} im ZIP oder games/${name}.json daneben ist Pflicht.`);
	}

	const { manifest, errors, warnings } = validateManifest({ ...inside, ...sidecar });
	const { errors: fileErrors, ignored } = validateFiles(
		files.filter((f) => f.path !== manifestPath).map((f) => ({ path: f.path, size: f.bytes.length }))
	);
	return {
		name,
		buffer,
		manifest,
		version: sha256(Buffer.concat([buffer, Buffer.from(sidecarRaw)])).slice(0, 12),
		fileCount: files.length - (manifestPath ? 1 : 0),
		unpackedBytes: files.reduce((sum, f) => sum + f.bytes.length, 0),
		settingsFrom: [manifestPath ? `${MANIFEST_FILE} im ZIP` : '', sidecarRaw ? `games/${name}.json` : ''].filter(Boolean),
		errors: [...problems, ...errors, ...fileErrors],
		warnings: [...warnings, ...ignored.map((p) => `„${p}“ wird ignoriert (Dateityp nicht erlaubt).`)]
	};
}

/**
 * Alles in einem Durchgang.
 * @param {{ pull?: boolean, log?: Log }} [options]
 * @returns {Promise<{ errors: string[], games: object[] }>}
 */
export async function syncGames({ pull = true, log = console } = {}) {
	if (pull) await pullSources(log);
	await mkdir(GAMES_DIR, { recursive: true });
	await mkdir(STATIC_DIR, { recursive: true });

	const zips = (await readdir(GAMES_DIR)).filter((n) => n.toLowerCase().endsWith('.zip')).sort();
	/** @type {string[]} */
	const errors = [];
	/** @type {object[]} */
	const games = [];
	/** @type {Map<string, string>} */
	const ids = new Map();
	for (const zipName of zips) {
		const result = await inspect(join(GAMES_DIR, zipName));
		for (const w of result.warnings ?? []) log.warn(`games/${zipName}: ${w}`);
		if (result.manifest && ids.has(result.manifest.id)) {
			result.errors.push(`„id“ „${result.manifest.id}“ ist schon in games/${ids.get(result.manifest.id)} vergeben.`);
		}
		const manifest = result.manifest;
		if (result.errors.length || !manifest || !result.buffer) {
			for (const e of result.errors) errors.push(`games/${zipName}: ${e}`);
			continue;
		}
		ids.set(manifest.id, zipName);
		await writeFile(join(STATIC_DIR, `${manifest.id}.zip`), result.buffer);
		games.push({
			id: manifest.id,
			version: result.version,
			url: `/games/${manifest.id}.zip`,
			source: zipName,
			settingsFrom: result.settingsFrom,
			fileCount: result.fileCount,
			unpackedBytes: result.unpackedBytes,
			manifest
		});
	}

	// Abgelegte Pakete entfernen, die es nicht mehr gibt.
	const keep = new Set([...ids.keys()].map((id) => `${id}.zip`));
	for (const name of await readdir(STATIC_DIR)) {
		if (name.endsWith('.zip') && !keep.has(name)) await rm(join(STATIC_DIR, name));
	}

	// Übersicht nur schreiben, wenn sie sich ändert (vermeidet unnötiges Neuladen im Dev-Server).
	const next = `${JSON.stringify(games, null, '\t')}\n`;
	const current = await readFile(INDEX_FILE, 'utf8').catch(() => '');
	if (current !== next) await writeFile(INDEX_FILE, next);

	for (const e of errors) log.error(e);
	log.info(`Spielpakete: ${games.length} bereit${errors.length ? `, ${errors.length} Fehler` : ''}.`);
	return { errors, games };
}

// Direkt aufgerufen (npm run games)?
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	syncGames({ pull: !process.argv.includes('--no-pull') }).then(
		({ errors }) => process.exit(errors.length ? 1 : 0),
		(error) => {
			console.error('Spielpakete konnten nicht verarbeitet werden:', error);
			process.exit(1);
		}
	);
}
