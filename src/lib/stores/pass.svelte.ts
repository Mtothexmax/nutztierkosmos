import { browser } from '$app/env';
import { read, remove, storageKeys, write } from '$lib/storage/db';
import { content, setPassHook } from '$lib/stores/content.svelte';
import type { UiKey } from '$lib/i18n.svelte';

/**
 * Forscherpass – freiwillige Gamification (LB 5.5).
 * - Nur nach aktiver Zustimmung gespeichert (LB 9.2: keine nicht erforderliche Speicherung ohne Einwilligung).
 * - Anonym: keine Namen, keine Bestenliste, keine Übertragung an einen Server.
 * - Inhalte sind ohne Pass vollständig zugänglich.
 */
type PassData = {
	enabled: boolean;
	since: string;
	read: string[];
	quizzes: Record<string, number>;
};

export type Badge = { id: string; icon: string; title: UiKey; text: UiKey; earned: boolean };

class PassStore {
	data = $state<PassData>({ enabled: false, since: '', read: [], quizzes: {} });

	init(): void {
		if (!browser) return;
		const stored = read<PassData | null>(storageKeys.pass, null);
		if (stored?.enabled) this.data = stored;
		setPassHook((score) => {
			if (score.refType !== 'quiz' || !score.maxPoints) return;
			const ratio = score.points / score.maxPoints;
			this.recordQuiz(score.refId, ratio);
		});
	}

	get enabled(): boolean {
		return this.data.enabled && content.settings.gamification;
	}

	enable(): void {
		this.data = { enabled: true, since: new Date().toISOString(), read: [], quizzes: {} };
		this.save();
	}

	disable(): void {
		this.data = { enabled: false, since: '', read: [], quizzes: {} };
		remove(storageKeys.pass);
	}

	private save(): void {
		if (this.data.enabled) write(storageKeys.pass, $state.snapshot(this.data));
	}

	markRead(exhibitionId: string): void {
		if (!this.enabled || this.data.read.includes(exhibitionId)) return;
		this.data.read = [...this.data.read, exhibitionId];
		this.save();
	}

	recordQuiz(quizId: string, ratio: number): void {
		if (!this.enabled) return;
		this.data.quizzes[quizId] = Math.max(this.data.quizzes[quizId] ?? 0, ratio);
		this.save();
	}

	hasRead(exhibitionId: string): boolean {
		return this.enabled && this.data.read.includes(exhibitionId);
	}

	best(quizId: string): number | undefined {
		return this.enabled ? this.data.quizzes[quizId] : undefined;
	}

	get badges(): Badge[] {
		const readCats = new Set(
			this.data.read.map((id) => {
				const e = content.getExhibition(id);
				return e ? content.categoryOfExhibition(e)?.id : undefined;
			})
		);
		const allCats = content.activeCategories().filter((c) => content.exhibitionsOfCategory(c.id).length);
		const goodQuizzes = Object.values(this.data.quizzes).filter((r) => r >= 0.8).length;
		const heat = Math.max(this.data.quizzes['q-hitze'] ?? 0, this.data.quizzes['q-hitze-en'] ?? 0);
		return [
			{ id: 'first', icon: 'auto_stories', title: 'badge.first', text: 'badge.first.text', earned: this.data.read.length > 0 },
			{ id: 'explorer', icon: 'explore', title: 'badge.explorer', text: 'badge.explorer.text', earned: allCats.length > 0 && allCats.every((c) => readCats.has(c.id)) },
			{ id: 'quiz', icon: 'military_tech', title: 'badge.quiz', text: 'badge.quiz.text', earned: goodQuizzes >= 3 },
			{ id: 'heat', icon: 'thermostat', title: 'badge.heat', text: 'badge.heat.text', earned: heat >= 0.6 }
		];
	}
}

export const pass = new PassStore();
