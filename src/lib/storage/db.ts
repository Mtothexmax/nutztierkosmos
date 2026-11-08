import { browser } from '$app/env';

const PREFIX = 'ntk:v1:';

export const storageKeys = {
	meta: `${PREFIX}meta`,
	session: `${PREFIX}session`,
	players: `${PREFIX}players`,
	modules: `${PREFIX}modules`,
	quizzes: `${PREFIX}quizzes`,
	games: `${PREFIX}games`,
	scores: `${PREFIX}scores`,
	settings: `${PREFIX}settings`,
	prefs: `${PREFIX}prefs`,
	lastResult: `${PREFIX}lastResult`
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
	Object.values(storageKeys).forEach((key) => localStorage.removeItem(key));
}
