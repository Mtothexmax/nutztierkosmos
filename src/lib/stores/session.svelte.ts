import { browser } from '$app/env';
import { remove, read, storageKeys, write } from '$lib/storage/db';
import { content } from '$lib/stores/content.svelte';
import type { Player, Session } from '$lib/types';
import { nowIso } from '$lib/utils';

class SessionStore {
	session = $state<Session | null>(null);
	ready = $state(false);

	init(): void {
		if (!browser || this.ready) return;
		const stored = read<Session | null>(storageKeys.session, null);
		// Nach einem Demo-Reset kann die gespeicherte Spieler-ID verwaist sein.
		this.session = stored && content.getPlayer(stored.playerId) ? stored : null;
		if (stored && !this.session) remove(storageKeys.session);
		this.ready = true;
	}

	get player(): Player | undefined {
		if (!this.session) return undefined;
		return content.getPlayer(this.session.playerId);
	}

	get isLoggedIn(): boolean {
		return Boolean(this.session && this.player);
	}

	login(name: string, avatar: string): Player | null {
		const trimmed = name.trim();
		if (trimmed.length < 2) return null;

		const existing = content.players.find(
			(p) => p.name.toLowerCase() === trimmed.toLowerCase()
		);
		const player = existing ?? content.addPlayer(trimmed, avatar);
		player.avatar = avatar;
		player.lastActiveAt = nowIso();
		content.updatePlayer(player);

		this.session = { playerId: player.id, startedAt: nowIso(), isAdmin: false };
		write(storageKeys.session, this.session);
		return player;
	}

	enterAdmin(): void {
		if (!this.session || !this.player) {
			const demo = content.players[0];
			if (!demo) return;
			this.session = { playerId: demo.id, startedAt: nowIso(), isAdmin: true };
		} else {
			this.session = { ...this.session, isAdmin: true };
		}
		write(storageKeys.session, this.session);
	}

	logout(): void {
		this.session = null;
		remove(storageKeys.session);
	}
}

export const session = new SessionStore();
