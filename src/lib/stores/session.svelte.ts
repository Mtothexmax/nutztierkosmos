import { browser } from '$app/env';
import { read, remove, storageKeys, write } from '$lib/storage/db';
import { content } from '$lib/stores/content.svelte';
import type { EditorUser, Player, Role } from '$lib/types';
import { nowIso } from '$lib/utils';

/**
 * Öffentliche Besucher sind anonym – es gibt keine Anmeldung, keinen Namen
 * und keine Bestenliste (LB 5.5, 9.2). Ergebnisse gehören „diesem Gerät“.
 *
 * Die Redaktion meldet sich (simuliert) an. Rollen und Rechte folgen dem
 * Prinzip der erforderlichen Berechtigungen (LB 6).
 */
export const LOCAL_PLAYER: Player = {
	id: 'local',
	name: 'Gast',
	avatar: '🔬',
	createdAt: '2026-01-01T00:00:00.000Z',
	lastActiveAt: '2026-01-01T00:00:00.000Z'
};

export type Permission =
	| 'content.edit'
	| 'content.submit'
	| 'content.publish'
	| 'content.delete'
	| 'structure.edit'
	| 'media.edit'
	| 'interactive.edit'
	| 'translations.edit'
	| 'users.manage'
	| 'stats.view'
	| 'stats.configure'
	| 'audit.view'
	| 'settings.edit';

export const roleLabel: Record<Role, string> = {
	admin: 'Administration',
	editor: 'Redaktion',
	reviewer: 'Fachprüfung',
	analyst: 'Auswertung'
};

export const roleDescription: Record<Role, string> = {
	admin: 'Alle Rechte inklusive Benutzerverwaltung, Einstellungen und Sicherheitsprotokoll.',
	editor: 'Legt Inhalte an, pflegt Medien und reicht Ausstellungen zur Prüfung ein. Veröffentlicht nicht selbst.',
	reviewer: 'Prüft Ausstellungen fachlich, gibt sie frei oder schickt sie mit Kommentar zurück.',
	analyst: 'Sieht nur die Nutzungsstatistik. Keine Änderungen an Inhalten.'
};

export const permissionLabel: Record<Permission, string> = {
	'content.edit': 'Inhalte bearbeiten',
	'content.submit': 'Zur Prüfung einreichen',
	'content.publish': 'Veröffentlichen / zurückweisen',
	'content.delete': 'Inhalte löschen',
	'structure.edit': 'Kategorien und Themen pflegen',
	'media.edit': 'Medien verwalten',
	'interactive.edit': 'Quizze, Spiele, Infografiken',
	'translations.edit': 'Texte & Übersetzungen',
	'users.manage': 'Benutzer und Rollen',
	'stats.view': 'Statistik ansehen',
	'stats.configure': 'Statistik konfigurieren',
	'audit.view': 'Sicherheitsprotokoll',
	'settings.edit': 'Einstellungen'
};

export const permissions: Record<Permission, Role[]> = {
	'content.edit': ['admin', 'editor', 'reviewer'],
	'content.submit': ['admin', 'editor'],
	'content.publish': ['admin', 'reviewer'],
	'content.delete': ['admin'],
	'structure.edit': ['admin', 'editor'],
	'media.edit': ['admin', 'editor'],
	'interactive.edit': ['admin', 'editor'],
	'translations.edit': ['admin', 'editor'],
	'users.manage': ['admin'],
	'stats.view': ['admin', 'editor', 'reviewer', 'analyst'],
	'stats.configure': ['admin'],
	'audit.view': ['admin'],
	'settings.edit': ['admin']
};

type AdminSession = { userId: string; startedAt: string };

class SessionStore {
	admin = $state<AdminSession | null>(null);
	ready = $state(false);

	init(): void {
		if (!browser || this.ready) return;
		const stored = read<AdminSession | null>(storageKeys.adminSession, null);
		this.admin = stored && content.getUser(stored.userId)?.active ? stored : null;
		this.ready = true;
	}

	/** Für Quiz-Player und Spiel-Host: anonymer Gast. */
	get player(): Player {
		return LOCAL_PLAYER;
	}

	get isLoggedIn(): boolean {
		return true;
	}

	get user(): EditorUser | undefined {
		return this.admin ? content.getUser(this.admin.userId) : undefined;
	}

	get isAdmin(): boolean {
		return Boolean(this.user?.active);
	}

	can(permission: Permission): boolean {
		const role = this.user?.role;
		return Boolean(role && this.user?.active && permissions[permission].includes(role));
	}

	/** Demo-Anmeldung: Passwort „demo“. Fehlversuche werden protokolliert (LB 9.2). */
	login(email: string, password: string): EditorUser | null {
		const user = content.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
		if (!user || !user.active || password !== 'demo') {
			content.log(user?.id ?? 'unbekannt', 'Fehlgeschlagener Anmeldeversuch', email.trim() || '–', 'security');
			return null;
		}
		user.lastLoginAt = nowIso();
		content.persistUsers();
		this.admin = { userId: user.id, startedAt: nowIso() };
		write(storageKeys.adminSession, this.admin);
		content.log(user.id, 'Anmeldung erfolgreich', 'Redaktion', 'security');
		return user;
	}

	logout(): void {
		if (this.user) content.log(this.user.id, 'Abmeldung', 'Redaktion', 'security');
		this.admin = null;
		remove(storageKeys.adminSession);
	}

	// Alte API, damit bestehende Seiten weiter funktionieren.
	enterAdmin(): void {}
}

export const session = new SessionStore();
