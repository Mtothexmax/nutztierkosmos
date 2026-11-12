import { unzipSync } from 'fflate';
import {
	findManifestPath,
	isJunkPath,
	MANIFEST_FILE,
	MAX_FILE_BYTES,
	MAX_FILES,
	MAX_TOTAL_BYTES,
	validateManifest,
	type GameManifest
} from './package-rules.js';
import type { Game, GameFile, GameFileKind } from '$lib/types';

const KIND_BY_EXT: Record<string, GameFileKind> = {
	html: 'html',
	htm: 'html',
	css: 'css',
	js: 'js',
	mjs: 'js',
	png: 'image',
	jpg: 'image',
	jpeg: 'image',
	gif: 'image',
	webp: 'image',
	svg: 'image',
	avif: 'image',
	mp3: 'audio',
	wav: 'audio',
	ogg: 'audio',
	m4a: 'audio',
	aac: 'audio',
	mp4: 'video',
	webm: 'video',
	ogv: 'video'
};

const MIME_BY_EXT: Record<string, string> = {
	html: 'text/html',
	htm: 'text/html',
	css: 'text/css',
	js: 'text/javascript',
	mjs: 'text/javascript',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	avif: 'image/avif',
	mp3: 'audio/mpeg',
	wav: 'audio/wav',
	ogg: 'audio/ogg',
	m4a: 'audio/mp4',
	aac: 'audio/aac',
	mp4: 'video/mp4',
	webm: 'video/webm',
	ogv: 'video/ogg'
};

export const ALLOWED_EXTENSIONS = Object.keys(KIND_BY_EXT);
// Grenzen und Einstellungsdatei: gemeinsam mit dem Build-Skript in package-rules.js.
export { MANIFEST_FILE, MAX_FILE_BYTES, MAX_FILES, MAX_TOTAL_BYTES, type GameManifest };

export type ZipResult = {
	files: GameFile[];
	blocked: string[];
	totalBytes: number;
	/** Einstellungen aus game.json, falls im ZIP vorhanden und gültig. */
	manifest: GameManifest | null;
	/** Probleme mit game.json (das Paket selbst ist trotzdem nutzbar). */
	manifestErrors: string[];
};

export function extensionOf(path: string): string {
	const clean = path.split('#')[0].split('?')[0];
	const dot = clean.lastIndexOf('.');
	return dot < 0 ? '' : clean.slice(dot + 1).toLowerCase();
}

export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/').replace(/^\.?\/+/, '').replace(/\/+/g, '/');
}

function dirname(path: string): string {
	const index = path.lastIndexOf('/');
	return index < 0 ? '.' : path.slice(0, index);
}

function basename(path: string): string {
	const index = path.lastIndexOf('/');
	return index < 0 ? path : path.slice(index + 1);
}

function normalizeSegments(path: string): string {
	const parts: string[] = [];
	for (const segment of path.split('/')) {
		if (!segment || segment === '.') continue;
		if (segment === '..') {
			parts.pop();
			continue;
		}
		parts.push(segment);
	}
	return parts.join('/');
}

function utf8ToBase64(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

export function fileDataUrl(file: GameFile): string {
	const base64 = file.encoding === 'base64' ? file.content : utf8ToBase64(file.content);
	return `data:${file.mime};base64,${base64}`;
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Erzeugt aus einer ZIP-Datei ein sicheres Dateipaket. */
export function readZipPackage(buffer: ArrayBuffer): ZipResult {
	const entries = unzipSync(new Uint8Array(buffer));
	const files: GameFile[] = [];
	const blocked: string[] = [];
	let totalBytes = 0;
	let manifest: GameManifest | null = null;
	let manifestErrors: string[] = [];

	const paths = Object.keys(entries)
		.filter((raw) => !raw.endsWith('/'))
		.map(normalizePath)
		.filter((path) => path && !isJunkPath(path));
	const manifestPath = findManifestPath(paths);

	for (const [rawPath, bytes] of Object.entries(entries)) {
		const path = normalizePath(rawPath);
		if (!path || rawPath.endsWith('/')) continue;
		if (isJunkPath(path)) continue;

		if (path === manifestPath) {
			try {
				const result = validateManifest(JSON.parse(new TextDecoder().decode(bytes)));
				manifest = result.manifest;
				manifestErrors = result.errors;
			} catch {
				manifestErrors = [`${MANIFEST_FILE} ist kein gültiges JSON.`];
			}
			continue;
		}

		const ext = extensionOf(path);
		const kind = KIND_BY_EXT[ext];
		if (!kind) {
			blocked.push(path);
			continue;
		}

		if (bytes.length > MAX_FILE_BYTES) {
			throw new Error(`„${path}“ ist zu groß (max. 5 MB pro Datei).`);
		}
		totalBytes += bytes.length;
		if (totalBytes > MAX_TOTAL_BYTES) {
			throw new Error('Das Paket ist zu groß (max. 5 MB entpackt).');
		}
		if (files.length >= MAX_FILES) {
			throw new Error(`Zu viele Dateien (max. ${MAX_FILES}).`);
		}

		const text = kind === 'html' || kind === 'css' || kind === 'js' || (kind === 'image' && ext === 'svg');
		files.push({
			path,
			kind,
			mime: MIME_BY_EXT[ext],
			encoding: text ? 'utf8' : 'base64',
			content: text ? new TextDecoder().decode(bytes) : bytesToBase64(bytes),
			size: bytes.length
		});
	}

	files.sort((a, b) => a.path.localeCompare(b.path, 'de'));
	return { files, blocked: blocked.sort(), totalBytes, manifest, manifestErrors };
}

/** Liefert das Dateipaket – inklusive Fallback für alte Einzel-HTML-Spiele. */
export function gameFiles(game: Game): GameFile[] {
	if (game.files?.length) return game.files;
	const legacy = game as Game & { source?: string };
	if (legacy.source) {
		return [
			{
				path: 'index.html',
				kind: 'html',
				mime: 'text/html',
				encoding: 'utf8',
				content: legacy.source,
				size: legacy.source.length
			}
		];
	}
	return [];
}

export function entryFile(files: GameFile[]): GameFile | null {
	const htmlFiles = files.filter((file) => file.kind === 'html');
	if (!htmlFiles.length) return null;
	const root = htmlFiles.find((file) => normalizePath(file.path).toLowerCase() === 'index.html');
	if (root) return root;
	const nestedIndex = htmlFiles.find((file) => /^index\.html?$/i.test(basename(file.path)));
	if (nestedIndex) return nestedIndex;
	return htmlFiles.sort((a, b) => a.path.split('/').length - b.path.split('/').length)[0];
}

function escapeInline(value: string, tag: 'script' | 'style'): string {
	return value.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);
}

function resolveRef(baseFile: string, ref: string): string | null {
	const raw = ref.trim();
	if (!raw || raw.startsWith('#') || raw.startsWith('//')) return null;
	if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;

	let clean = raw.split('#')[0].split('?')[0];
	try {
		clean = decodeURI(clean);
	} catch {
		/* keep raw */
	}
	if (!clean) return null;

	const base = clean.startsWith('/')
		? clean.slice(1)
		: dirname(baseFile) === '.'
			? clean
			: `${dirname(baseFile)}/${clean}`;
	return normalizeSegments(base);
}

function lookup(baseFile: string, ref: string, files: Map<string, GameFile>): GameFile | null {
	const path = resolveRef(baseFile, ref);
	if (!path) return null;
	return files.get(path) ?? files.get(path.toLowerCase()) ?? null;
}

function processCss(css: string, baseFile: string, files: Map<string, GameFile>): string {
	return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, _quote, ref: string) => {
		const file = lookup(baseFile, ref, files);
		return file ? `url("${fileDataUrl(file)}")` : match;
	});
}

function attr(tag: string, name: string): string | null {
	const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
	return match ? (match[2] ?? match[3] ?? match[4] ?? '') : null;
}

function placeholderBundle(message: string): string {
	return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F1F8F4;color:#5B6B63;font-family:Inter,system-ui,sans-serif;padding:24px;text-align:center}</style></head><body><p>${message}</p></body></html>`;
}

/** Baut aus dem Dateipaket ein eigenständiges HTML-Dokument für das iframe. */
export function bundleGame(game: Game): string {
	const files = gameFiles(game);
	const entry = entryFile(files);
	if (!entry) {
		return placeholderBundle('Keine HTML-Datei im Paket gefunden. Bitte eine index.html hinzufügen.');
	}

	const map = new Map<string, GameFile>();
	for (const file of files) {
		map.set(normalizePath(file.path), file);
		map.set(normalizePath(file.path).toLowerCase(), file);
	}

	let html = entry.content;
	const inlined = new Set<string>();

	// Stylesheets einbetten
	html = html.replace(/<link\b[^>]*>/gi, (tag) => {
		if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
		const href = attr(tag, 'href');
		const file = href ? lookup(entry.path, href, map) : null;
		if (!file || file.kind !== 'css') return tag;
		inlined.add(normalizePath(file.path));
		return `<style>\n${escapeInline(processCss(file.content, file.path, map), 'style')}\n</style>`;
	});

	// Externe Skripte einbetten
	html = html.replace(
		/<script\b([^>]*?)\bsrc\s*=\s*("|')([^"']+)\2([^>]*)>\s*<\/script>/gi,
		(match, before: string, _quote, src: string, after: string) => {
			const file = lookup(entry.path, src, map);
			if (!file || file.kind !== 'js') return match;
			inlined.add(normalizePath(file.path));
			return `<script${before}${after}>${escapeInline(file.content, 'script')}</script>`;
		}
	);

	// Asset-Verweise in src/href/poster/data in Data-URLs umwandeln
	html = html.replace(
		/\b(src|href|poster|data)\s*=\s*("|')([^"']+)\2/gi,
		(match, name: string, _quote, ref: string) => {
			const file = lookup(entry.path, ref, map);
			return file ? `${name}="${fileDataUrl(file)}"` : match;
		}
	);

	// srcset unterstützen
	html = html.replace(/\bsrcset\s*=\s*("|')([^"']+)\1/gi, (match, _quote, value: string) => {
		const rewritten = value
			.split(',')
			.map((part) => {
				const [ref, ...descriptor] = part.trim().split(/\s+/);
				const file = lookup(entry.path, ref, map);
				return file ? [fileDataUrl(file), ...descriptor].join(' ') : part.trim();
			})
			.join(', ');
		return `srcset="${rewritten}"`;
	});

	// CSS in <style>-Blöcken
	html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_match, attrs, css: string) => {
		return `<style${attrs}>${processCss(css, entry.path, map)}</style>`;
	});

	return injectRuntimeResolver(html, entry, files, inlined);
}

/**
 * Pfade, die das Spiel erst zur Laufzeit setzt (innerHTML, img.src, new Audio,
 * fetch …), zeigen im srcdoc-iframe auf die Plattform statt aufs Paket. Dieses
 * Skript läuft vor allen Spielskripten und löst solche Pfade gegen die
 * Paketdateien auf. Bereits eingebettete Skripte und Stylesheets fehlen in der
 * Tabelle, damit das Bundle nicht doppelt so groß wird.
 */
function injectRuntimeResolver(html: string, entry: GameFile, files: GameFile[], inlined: Set<string>): string {
	const table: Record<string, string> = {};
	for (const file of files) {
		const path = normalizePath(file.path);
		if (file === entry || inlined.has(path)) continue;
		table[path] = fileDataUrl(file);
	}
	if (Object.keys(table).length === 0) return html;
	const baseDir = dirname(normalizePath(entry.path));
	const script = `<script>(function () {
  var F = ${JSON.stringify(table).replace(/</g, '\\u003c')};
  var BASE = ${JSON.stringify(baseDir === '.' ? '' : baseDir + '/')};
  function res(u) {
    if (typeof u !== 'string' || !u || /^([a-z][a-z0-9+.-]*:|\\/\\/|#)/i.test(u)) return u;
    var p = u.split('#')[0].split('?')[0];
    try { p = decodeURI(p); } catch (e) {}
    p = p.charAt(0) === '/' ? p.slice(1) : BASE + p;
    var out = [];
    p.split('/').forEach(function (s) { if (s === '..') out.pop(); else if (s && s !== '.') out.push(s); });
    p = out.join('/');
    return F[p] || F[p.toLowerCase()] || u;
  }
  function patch(proto, prop) {
    var d = proto && Object.getOwnPropertyDescriptor(proto, prop);
    if (!d || !d.set) return;
    Object.defineProperty(proto, prop, { configurable: true, enumerable: d.enumerable, get: d.get,
      set: function (v) { d.set.call(this, res(v)); } });
  }
  patch(HTMLImageElement.prototype, 'src');
  patch(HTMLMediaElement.prototype, 'src');
  patch(HTMLSourceElement.prototype, 'src');
  patch(HTMLVideoElement.prototype, 'poster');
  var ATTR = /^(src|poster)$/i;
  var setAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) {
    return setAttr.call(this, n, ATTR.test(n) ? res(String(v)) : v);
  };
  function fix(el) {
    if (!el || el.nodeType !== 1) return;
    ['src', 'poster'].forEach(function (a) {
      var v = el.getAttribute(a);
      if (v) { var r = res(v); if (r !== v) setAttr.call(el, a, r); }
    });
  }
  new MutationObserver(function (list) {
    list.forEach(function (m) {
      if (m.type === 'attributes') return fix(m.target);
      m.addedNodes.forEach(function (n) {
        fix(n);
        if (n.querySelectorAll) n.querySelectorAll('[src],[poster]').forEach(fix);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'poster'] });
  if (window.fetch) {
    var f = window.fetch;
    window.fetch = function (input, init) { return f.call(this, typeof input === 'string' ? res(input) : input, init); };
  }
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    var args = Array.prototype.slice.call(arguments);
    args[1] = res(String(url));
    return open.apply(this, args);
  };
})();</script>`;
	if (/<head\b[^>]*>/i.test(html)) return html.replace(/<head\b[^>]*>/i, (tag) => tag + script);
	return script + html;
}

export const starterIndexHtml = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Neues Spiel</title>
<style>
  :root { --green: #1C6B4C; --lime: #8DBF3F; --sand: #F1F8F4; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 20px; font-family: Inter, system-ui, sans-serif; background: var(--sand); color: #101915; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
  h1 { margin: 0; font-size: 18px; }
  .who { font-size: 12px; color: #5B6B63; background: #fff; border-radius: 999px; padding: 4px 10px; }
  main { display: grid; gap: 10px; }
  button { border: 0; border-radius: 12px; padding: 12px 16px; font-weight: 600; font-size: 14px; cursor: pointer; background: var(--green); color: #fff; }
  button.ghost { background: #fff; color: var(--green); border: 1px solid #DCEFE5; }
  #msg { font-size: 13px; color: #5B6B63; }
</style>
</head>
<body>
  <header>
    <h1>Neues Spiel</h1>
    <span class="who">Spieler: <b id="who">…</b></span>
  </header>
  <main>
    <p id="msg">Ersetze diese Datei durch dein Spiel oder ergänze CSS, JS und Medien.</p>
    <button id="score">10 Punkte sammeln</button>
    <button id="done" class="ghost">Fertig</button>
  </main>
  <script>
    var points = 0;
    var started = Date.now();
    var send = function (type, payload) {
      parent.postMessage({ source: 'ntk-game', type: type, payload: payload || {} }, '*');
    };
    document.getElementById('score').addEventListener('click', function () {
      points += 10;
      document.getElementById('msg').textContent = points + ' Punkte gesammelt.';
      send('SCORE', { points: points, maxPoints: 100 });
    });
    document.getElementById('done').addEventListener('click', function () {
      send('COMPLETE', { points: points, maxPoints: 100, durationMs: Date.now() - started });
    });
    window.addEventListener('message', function (event) {
      var data = event.data;
      if (!data || data.source !== 'ntk-platform') return;
      if (data.type === 'INIT') {
        document.getElementById('who').textContent = data.payload.player.name;
        send('READY');
      }
      if (data.type === 'RESET') window.location.reload();
    });
    send('READY');
  </script>
</body>
</html>
`;
