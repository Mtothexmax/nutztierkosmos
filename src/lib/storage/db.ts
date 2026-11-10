import { browser } from '$app/env';

/**
 * Speicher des Click-Dummys. Alles liegt im localStorage des Browsers.
 * Im Echtbetrieb ersetzt eine API/Datenbank diese Schicht; die Stores
 * greifen nur über read/write zu, damit der Austausch an einer Stelle passiert.
 */
const PREFIX = 'ntk:v2:';

export const storageKeys = {
	meta: `${PREFIX}meta`,
	categories: `${PREFIX}categories`,
	topics: `${PREFIX}topics`,
	fields: `${PREFIX}fields`,
	exhibitions: `${PREFIX}exhibitions`,
	publications: `${PREFIX}publications`,
	keywords: `${PREFIX}keywords`,
	media: `${PREFIX}media`,
	infographics: `${PREFIX}infographics`,
	quizzes: `${PREFIX}quizzes`,
	games: `${PREFIX}games`,
	users: `${PREFIX}users`,
	audit: `${PREFIX}audit`,
	stats: `${PREFIX}stats`,
	statsConfig: `${PREFIX}statsConfig`,
	settings: `${PREFIX}settings`,
	uiTexts: `${PREFIX}uiTexts`,
	prefs: `${PREFIX}prefs`,
	/** Technisch notwendig: gewählte Sprache. */
	locale: `${PREFIX}locale`,
	/** Nur mit Zustimmung: anonymer Forscherpass auf diesem Gerät. */
	pass: `${PREFIX}pass`,
	/** Simulierte Redaktions-Anmeldung. */
	adminSession: `${PREFIX}adminSession`,
	/** Ergebnis des zuletzt gespielten Quiz/Spiels (für die Ergebnisseite). */
	lastResult: `${PREFIX}lastResult`,
	/** Präsentationsmodus: Anforderungs-Panel offen/zu. */
	reqPanel: `${PREFIX}reqPanel`
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];

export function read<T>(key: StorageKey, fallback: T): T {
	if (!browser) return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

export function write<T>(key: StorageKey, value: T): boolean {
	if (!browser) return false;
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}

export function remove(key: StorageKey): void {
	if (!browser) return;
	try {
		localStorage.removeItem(key);
	} catch {
		/* ignore */
	}
}

export function clearAll(): void {
	if (!browser) return;
	try {
		Object.keys(localStorage)
			.filter((key) => key.startsWith('ntk:'))
			.forEach((key) => localStorage.removeItem(key));
	} catch {
		/* ignore */
	}
}
