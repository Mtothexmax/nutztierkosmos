import { browser } from '$app/env';
import type { GameFile } from '$lib/types';

/**
 * Ablage für die Dateien der HTML-Spiele.
 *
 * localStorage fasst je nach Browser nur rund 5 MB – für alle Inhalte zusammen.
 * Spielpakete (bis 5 MB, als Base64 rund ein Drittel größer) liegen deshalb in
 * IndexedDB; die übrigen Spieldaten bleiben im localStorage. Wie dort gilt:
 * nur lokal im Browser, nichts verlässt das Gerät. Im Echtbetrieb ersetzt ein
 * Datei-Speicher des Servers diese Schicht.
 */
const DB_NAME = 'ntk-v2';
const STORE = 'gameFiles';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
	if (!browser || typeof indexedDB === 'undefined') {
		return Promise.reject(new Error('IndexedDB nicht verfügbar'));
	}
	dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () => reject(new Error('IndexedDB blockiert'));
	}).catch((error) => {
		dbPromise = null;
		throw error;
	});
	return dbPromise;
}

function done(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error ?? new Error('Transaktion abgebrochen'));
	});
}

/** Alle gespeicherten Dateipakete, nach Spiel-ID. */
export async function loadAllGameFiles(): Promise<Map<string, GameFile[]>> {
	const db = await open();
	const tx = db.transaction(STORE, 'readonly');
	const store = tx.objectStore(STORE);
	const keys = store.getAllKeys();
	const values = store.getAll();
	await done(tx);
	const result = new Map<string, GameFile[]>();
	keys.result.forEach((key, i) => result.set(String(key), values.result[i] as GameFile[]));
	return result;
}

/** Ersetzt den gesamten Bestand – so verschwinden auch Dateien gelöschter Spiele. */
export async function replaceAllGameFiles(entries: { id: string; files: GameFile[] }[]): Promise<void> {
	const db = await open();
	const tx = db.transaction(STORE, 'readwrite');
	const store = tx.objectStore(STORE);
	store.clear();
	for (const entry of entries) store.put(entry.files, entry.id);
	await done(tx);
}

export async function clearGameFiles(): Promise<void> {
	try {
		const db = await open();
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).clear();
		await done(tx);
	} catch {
		/* ignore */
	}
}
