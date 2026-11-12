/**
 * Zweisprachige Quizze und Spiele.
 *
 * Ein Quiz oder Spiel ist genau ein Datensatz. Alle Texte darin sind `L10n` ({ de, en }).
 * Die Redaktion schaltet im Editor zwischen Deutsch und Englisch um und trägt die Texte ein.
 * Für die Anzeige wird ein Quiz mit `localizeQuiz` in eine Sprache aufgelöst.
 *
 * Außerdem: Umzug alter Daten, bei denen eine Übersetzung ein eigener Datensatz war
 * (`lang` + `translationOf`).
 */
import type { Game, L10n, Locale, Question, Quiz } from '$lib/types';

/* ------------------------------------------------------------------ */
/* Texte auflösen                                                      */
/* ------------------------------------------------------------------ */

const has = (value: string | undefined): value is string => Boolean(value?.trim());

/** Text in der gewünschten Sprache; fehlt Englisch, kommt Deutsch. */
export function pick(value: L10n | undefined, locale: Locale): string {
	if (!value) return '';
	return locale === 'en' && has(value.en) ? value.en : value.de;
}

const pickOpt = (value: L10n | undefined, locale: Locale): string | undefined =>
	value === undefined ? undefined : pick(value, locale);

/** Alle übersetzbaren Texte einer Frage. */
export function questionTexts(q: Question): L10n[] {
	const out: L10n[] = [q.prompt];
	if (q.explanation) out.push(q.explanation);
	if (q.type === 'mc') out.push(...q.options.map((o) => o.text));
	if (q.type === 'image') {
		if (q.mode === 'choice') out.push(...(q.options ?? []).map((o) => o.text));
		if (q.mode === 'input' && q.answer) out.push(q.answer);
		if (q.mode === 'click' && q.clickInstruction) out.push(q.clickInstruction);
	}
	if (q.type === 'match') out.push(...q.left.map((i) => i.text), ...q.right.map((i) => i.text));
	return out;
}

/** Alle übersetzbaren Texte eines Quiz (für Vollständigkeit und Suche). */
export function quizTexts(quiz: Quiz): L10n[] {
	return [quiz.title, quiz.description, ...quiz.questions.flatMap(questionTexts)];
}

/** Fehlen in einer Liste Texte in einer Sprache? Gezählt werden nur Texte mit deutschem Inhalt. */
export function textsMissing(texts: L10n[], locale: Locale): boolean {
	return locale === 'en' && texts.some((t) => has(t.de) && !has(t.en));
}

/** Wie weit ist ein Quiz in einer Sprache gepflegt? Gezählt werden Texte mit deutschem Inhalt. */
export function quizProgress(quiz: Quiz, locale: Locale): { done: number; total: number } {
	const texts = quizTexts(quiz).filter((t) => has(t.de));
	const done = texts.filter((t) => has(locale === 'en' ? t.en : t.de)).length;
	return { done, total: texts.length };
}

/** Ein Quiz gilt in einer Sprache als vorhanden, wenn alle Texte dort gepflegt sind. */
export function quizHasLocale(quiz: Quiz, locale: Locale): boolean {
	if (locale === 'de') return true;
	const { done, total } = quizProgress(quiz, locale);
	return total > 0 && done === total;
}

/**
 * Sprache, in der ein Quiz gespielt wird: die gewünschte, wenn sie vollständig ist, sonst Deutsch.
 * Halbe Übersetzungen werden so nie gemischt angezeigt.
 */
export function quizLocale(quiz: Quiz, wanted: Locale): Locale {
	return quizHasLocale(quiz, wanted) ? wanted : 'de';
}

/** Quiz für die Anzeige in einer Sprache. */
export function localizeQuiz(quiz: Quiz, locale: Locale): Quiz<string> {
	return {
		...quiz,
		title: pick(quiz.title, locale),
		description: pick(quiz.description, locale),
		questions: quiz.questions.map((q) => localizeQuestion(q, locale))
	};
}

function localizeQuestion(q: Question, locale: Locale): Question<string> {
	const base = { ...q, prompt: pick(q.prompt, locale), explanation: pickOpt(q.explanation, locale) };
	switch (q.type) {
		case 'mc':
			return { ...base, type: 'mc', options: q.options.map((o) => ({ ...o, text: pick(o.text, locale) })) } as Question<string>;
		case 'tf':
			return { ...base, type: 'tf' } as Question<string>;
		case 'image':
			return {
				...base,
				type: 'image',
				options: q.options?.map((o) => ({ ...o, text: pick(o.text, locale) })),
				answer: pickOpt(q.answer, locale),
				clickInstruction: pickOpt(q.clickInstruction, locale)
			} as Question<string>;
		case 'match':
			return {
				...base,
				type: 'match',
				left: q.left.map((i) => ({ ...i, text: pick(i.text, locale) })),
				right: q.right.map((i) => ({ ...i, text: pick(i.text, locale) }))
			} as Question<string>;
	}
}

/** Sprache, in der ein Spiel startet: die gewünschte, wenn das Spiel sie kann, sonst seine erste. */
export function gameLocale(game: Game, wanted: Locale): Locale {
	const languages = game.languages?.length ? game.languages : ['de' as const];
	return languages.includes(wanted) ? wanted : languages[0];
}

/* ------------------------------------------------------------------ */
/* Umzug alter Daten (eine Übersetzung = eigener Datensatz)            */
/* ------------------------------------------------------------------ */

type Legacy = Record<string, unknown> & { id: string; lang?: Locale; translationOf?: string };

const isLegacyText = (v: unknown): v is string => typeof v === 'string';

/** Alten String in L10n umwandeln. Englische Originale bekommen den Text in beiden Sprachen. */
function toL10n(value: unknown, lang: Locale): L10n {
	if (value && typeof value === 'object' && 'de' in value) return value as L10n;
	const text = isLegacyText(value) ? value : '';
	return lang === 'en' ? { de: text, en: text } : { de: text, en: '' };
}

const optL10n = (value: unknown, lang: Locale): L10n | undefined =>
	value === undefined || value === null ? undefined : toL10n(value, lang);

function convertQuestion(raw: Record<string, unknown>, lang: Locale): Question {
	const list = (key: string) =>
		Array.isArray(raw[key])
			? (raw[key] as Record<string, unknown>[]).map((o) => ({ ...o, text: toL10n(o.text, lang) }))
			: undefined;
	const q: Record<string, unknown> = {
		...raw,
		prompt: toL10n(raw.prompt, lang),
		explanation: optL10n(raw.explanation, lang)
	};
	if (raw.options) q.options = list('options');
	if (raw.left) q.left = list('left');
	if (raw.right) q.right = list('right');
	if (raw.answer !== undefined) q.answer = optL10n(raw.answer, lang);
	if (raw.clickInstruction !== undefined) q.clickInstruction = optL10n(raw.clickInstruction, lang);
	return q as Question;
}

/** Englische Texte einer alten Übersetzung in das Original übernehmen (Reihenfolge wie im Original). */
function mergeEnglish(target: L10n | undefined, source: unknown): void {
	if (!target || !isLegacyText(source) || has(target.en)) return;
	target.en = source;
}

function mergeQuizTranslation(original: Quiz, translation: Legacy): void {
	mergeEnglish(original.title, translation.title);
	mergeEnglish(original.description, translation.description);
	const questions = Array.isArray(translation.questions) ? (translation.questions as Record<string, unknown>[]) : [];
	original.questions.forEach((q, i) => {
		const t = questions[i];
		if (!t || t.type !== q.type) return;
		mergeEnglish(q.prompt, t.prompt);
		mergeEnglish(q.explanation, t.explanation);
		const mergeList = (items: { text: L10n }[] | undefined, other: unknown) => {
			if (!items || !Array.isArray(other)) return;
			items.forEach((item, k) => mergeEnglish(item.text, (other[k] as { text?: unknown } | undefined)?.text));
		};
		if (q.type === 'mc' || q.type === 'image') mergeList(q.options, t.options);
		if (q.type === 'image') {
			mergeEnglish(q.answer, t.answer);
			mergeEnglish(q.clickInstruction, t.clickInstruction);
		}
		if (q.type === 'match') {
			mergeList(q.left, t.left);
			mergeList(q.right, t.right);
		}
	});
}

/**
 * Bringt gespeicherte Quizze ins aktuelle Format.
 * @returns die Quizze, eine Zuordnung alte Übersetzungs-ID → Original-ID und ob sich etwas geändert hat
 */
export function migrateQuizzes(raw: unknown[]): { quizzes: Quiz[]; renamed: Map<string, string>; changed: boolean } {
	const renamed = new Map<string, string>();
	const legacy = raw as Legacy[];
	if (!legacy.some((q) => isLegacyText(q.title) || 'lang' in q || 'translationOf' in q)) {
		return { quizzes: raw as Quiz[], renamed, changed: false };
	}
	const byId = new Map(legacy.map((q) => [q.id, q]));
	const quizzes: Quiz[] = [];
	const translations: Legacy[] = [];
	for (const q of legacy) {
		if (q.translationOf && byId.has(q.translationOf)) {
			translations.push(q);
			continue;
		}
		const lang = q.lang ?? 'de';
		const { lang: _l, translationOf: _t, ...rest } = q;
		quizzes.push({
			...(rest as unknown as Quiz),
			title: toL10n(q.title, lang),
			description: toL10n(q.description, lang),
			questions: ((q.questions as Record<string, unknown>[]) ?? []).map((x) => convertQuestion(x, lang))
		});
	}
	for (const t of translations) {
		const original = quizzes.find((q) => q.id === t.translationOf);
		if (!original) continue;
		if (t.lang === 'en') mergeQuizTranslation(original, t);
		renamed.set(t.id, original.id);
	}
	return { quizzes, renamed, changed: true };
}

/** Bringt gespeicherte Spiele ins aktuelle Format (zweisprachige Texte, `languages`). */
export function migrateGames(raw: unknown[]): { games: Game[]; renamed: Map<string, string>; changed: boolean } {
	const renamed = new Map<string, string>();
	const legacy = raw as Legacy[];
	if (!legacy.some((g) => isLegacyText(g.title) || !Array.isArray(g.languages) || 'translationOf' in g)) {
		return { games: raw as Game[], renamed, changed: false };
	}
	const byId = new Map(legacy.map((g) => [g.id, g]));
	const games: Game[] = [];
	const translations: Legacy[] = [];
	for (const g of legacy) {
		if (g.translationOf && byId.has(g.translationOf)) {
			translations.push(g);
			continue;
		}
		const lang = g.lang ?? 'de';
		const { lang: _l, translationOf: _t, ...rest } = g;
		games.push({
			...(rest as unknown as Game),
			title: toL10n(g.title, lang),
			description: toL10n(g.description, lang),
			languages: Array.isArray(g.languages) ? (g.languages as Locale[]) : [lang]
		});
	}
	for (const t of translations) {
		const original = games.find((g) => g.id === t.translationOf);
		if (!original) continue;
		if (t.lang === 'en') {
			mergeEnglish(original.title, t.title);
			mergeEnglish(original.description, t.description);
		}
		renamed.set(t.id, original.id);
	}
	return { games, renamed, changed: true };
}
