import { goto as kitGoto } from '$app/navigation';
import { resolve } from '$app/paths';

/**
 * Unterpfad der App. Lokal und auf einem eigenen Server leer, beim statischen Export
 * für GitHub Pages "/nutztierkosmos" (siehe export.ps1 → paths.base).
 *
 * Die App schreibt Pfade überall als "/themen", "/demo/bild.jpg" usw. Statt jede Stelle
 * umzubauen, ergänzt withBase() den Unterpfad dort, wo navigiert oder geladen wird, und
 * fixBaseLinks() (im Root-Layout) korrigiert Links und Medien im DOM.
 */
export const BASE = resolve('/').replace(/\/$/, '');

/** "/themen" → "/nutztierkosmos/themen"; externe, relative, data:- und schon passende Pfade bleiben. */
export function withBase(path: string): string;
export function withBase(path: string | undefined): string | undefined;
export function withBase(path: string | undefined): string | undefined {
	if (!path || !BASE || !path.startsWith('/') || path.startsWith('//')) return path;
	if (path === BASE || path.startsWith(`${BASE}/`) || path.startsWith(`${BASE}?`) || path.startsWith(`${BASE}#`)) return path;
	return `${BASE}${path}`;
}

/** "/nutztierkosmos/themen" → "/themen" – für Vergleiche mit Routen. */
export function stripBase(pathname: string): string {
	if (!BASE) return pathname;
	if (pathname === BASE) return '/';
	return pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length) : pathname;
}

/** goto() mit Unterpfad – Ersatz für den Import aus '$app/navigation'. */
export function goto(url: string, options?: Parameters<typeof kitGoto>[1]): ReturnType<typeof kitGoto> {
	return kitGoto(withBase(url), options);
}

const ATTRS: [string, string][] = [
	['a[href^="/"]', 'href'],
	['img[src^="/"]', 'src'],
	['source[src^="/"]', 'src'],
	['video[src^="/"]', 'src'],
	['video[poster^="/"]', 'poster'],
	['audio[src^="/"]', 'src'],
	['track[src^="/"]', 'src']
];

function fixIn(root: ParentNode) {
	for (const [selector, attr] of ATTRS) {
		root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
			const value = el.getAttribute(attr);
			if (value) {
				const next = withBase(value);
				if (next !== value) el.setAttribute(attr, next);
			}
		});
	}
}

/**
 * Ergänzt bei allen Links und Medien mit absolutem Pfad den Unterpfad – auch bei später
 * gerenderten Elementen. Nur aktiv, wenn es einen Unterpfad gibt.
 * @returns Aufräumfunktion
 */
export function fixBaseLinks(root: HTMLElement = document.body): () => void {
	if (!BASE) return () => {};
	fixIn(root);
	const observer = new MutationObserver((mutations) => {
		for (const m of mutations) {
			if (m.type === 'attributes' && m.target instanceof HTMLElement) fixIn(m.target.parentElement ?? m.target);
			else m.addedNodes.forEach((n) => n instanceof HTMLElement && fixIn(n.parentElement ?? n));
		}
	});
	observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['href', 'src', 'poster'] });
	return () => observer.disconnect();
}
