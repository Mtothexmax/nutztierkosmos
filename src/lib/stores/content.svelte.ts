import { browser } from '$app/env';
import { i18n } from '$lib/i18n.svelte';
import { read, storageKeys, write, type StorageKey } from '$lib/storage/db';
import { loadAllGameFiles, replaceAllGameFiles } from '$lib/storage/files-db';
import { withBase } from '$lib/paths';
import {
	SEED_VERSION,
	seedAudit,
	seedCategories,
	seedExhibitions,
	seedFields,
	seedGames,
	seedInfographics,
	seedKeywords,
	seedMedia,
	seedPrefs,
	seedPublications,
	seedQuizzes,
	seedSettings,
	seedStats,
	seedStatsConfig,
	seedTopics,
	seedUsers
} from '$lib/storage/seed';
import { readZipPackage, starterIndexHtml, type GameManifest } from '$lib/games/files';
import packagedGames from '$lib/games/packaged.json';
import type {
	Activity,
	ActivityBase,
	Audience,
	AuditEntry,
	Block,
	Category,
	EditorUser,
	Exhibition,
	Field,
	Game,
	GameFile,
	Infographic,
	Keyword,
	L10n,
	Locale,
	MediaItem,
	Preferences,
	Publication,
	Quiz,
	Score,
	Settings,
	Status,
	StatsConfig,
	StatsData,
	Topic
} from '$lib/types';
import { nowIso, uid } from '$lib/utils';

type Meta = { seedVersion: number; createdAt: string; lastResetAt: string };

const starterFiles = (): GameFile[] => [
	{
		path: 'index.html',
		kind: 'html',
		mime: 'text/html',
		encoding: 'utf8',
		content: starterIndexHtml,
		size: starterIndexHtml.length
	}
];

export type SearchType = 'exhibition' | 'publication' | 'quiz';

export type SearchHit = {
	type: SearchType;
	id: string;
	title: string;
	titleLang: Locale;
	text: string;
	href: string;
	date: string;
	categoryId?: string;
	topicId?: string;
	fieldId?: string;
	score: number;
	mediaId?: string;
};

export type SearchQuery = {
	q: string;
	categoryId?: string;
	fieldId?: string;
	keywordId?: string;
	audience?: Audience;
	type?: SearchType;
	sort: 'relevance' | 'date' | 'title';
};

/** Ein Text in allen Sprachen, kleingeschrieben – für die Volltextsuche. */
const flat = (v: L10n | undefined) => `${v?.de ?? ''} ${v?.en ?? ''}`.toLowerCase();

function blockText(block: Block): string {
	switch (block.type) {
		case 'text':
			return flat(block.heading) + ' ' + flat(block.body);
		case 'facts':
			return flat(block.heading) + ' ' + block.items.map(flat).join(' ');
		case 'gallery':
			return flat(block.heading);
		default:
			return '';
	}
}

const empty = (): L10n => ({ de: '', en: '' });

class ContentStore {
	categories = $state<Category[]>([]);
	topics = $state<Topic[]>([]);
	fields = $state<Field[]>([]);
	exhibitions = $state<Exhibition[]>([]);
	publications = $state<Publication[]>([]);
	keywords = $state<Keyword[]>([]);
	media = $state<MediaItem[]>([]);
	infographics = $state<Infographic[]>([]);
	quizzes = $state<Quiz[]>([]);
	games = $state<Game[]>([]);
	users = $state<EditorUser[]>([]);
	audit = $state<AuditEntry[]>([]);
	stats = $state<StatsData>(structuredClone(seedStats));
	statsConfig = $state<StatsConfig>(structuredClone(seedStatsConfig));
	settings = $state<Settings>(structuredClone(seedSettings));
	prefs = $state<Preferences>(structuredClone(seedPrefs));
	/** Ergebnisse im Speicher; dauerhaft nur mit aktivem Forscherpass (siehe pass-Store). */
	scores = $state<Score[]>([]);
	loaded = $state(false);
	/** Spieldateien liegen in IndexedDB und kommen kurz nach dem Start dazu. */
	gameFilesReady = $state(false);
	/** false, wenn IndexedDB fehlt – dann bleiben die Dateien wie früher im localStorage. */
	private filesInIdb = true;
	private filesLoading: Promise<unknown> = Promise.resolve();

	init(): void {
		if (!browser || this.loaded) return;
		const meta = read<Meta | null>(storageKeys.meta, null);
		if (!meta || meta.seedVersion !== SEED_VERSION) {
			this.resetDemo();
		} else {
			this.categories = read(storageKeys.categories, []);
			this.topics = read(storageKeys.topics, []);
			this.fields = read(storageKeys.fields, seedFields);
			this.exhibitions = read(storageKeys.exhibitions, []);
			this.publications = read(storageKeys.publications, []);
			this.keywords = read(storageKeys.keywords, []);
			this.media = read(storageKeys.media, []);
			this.infographics = read(storageKeys.infographics, []);
			this.quizzes = read(storageKeys.quizzes, []);
			this.games = read(storageKeys.games, []);
			this.filesLoading = this.hydrateGameFiles();
			this.users = read(storageKeys.users, []);
			this.audit = read(storageKeys.audit, []);
			this.stats = read(storageKeys.stats, structuredClone(seedStats));
			this.statsConfig = read(storageKeys.statsConfig, structuredClone(seedStatsConfig));
			this.settings = { ...seedSettings, ...read<Partial<Settings>>(storageKeys.settings, {}) };
			this.prefs = read(storageKeys.prefs, structuredClone(seedPrefs));
		}
		i18n.englishEnabled = this.settings.englishEnabled;
		this.loaded = true;
	}

	resetDemo(): void {
		this.categories = structuredClone(seedCategories);
		this.topics = structuredClone(seedTopics);
		this.fields = structuredClone(seedFields);
		this.exhibitions = structuredClone(seedExhibitions);
		this.publications = structuredClone(seedPublications);
		this.keywords = structuredClone(seedKeywords);
		this.media = structuredClone(seedMedia);
		this.infographics = structuredClone(seedInfographics);
		this.quizzes = structuredClone(seedQuizzes);
		this.games = [...structuredClone(seedGames), ...packagedGames.map((p) => this.gameFromPackage(p))];
		// Spiele aus games/ bringen ihre Dateien als ZIP mit – vor dem Speichern laden.
		this.gameFilesReady = false;
		this.filesLoading = this.loadPackageFiles().finally(() => (this.gameFilesReady = true));
		this.users = structuredClone(seedUsers);
		this.audit = structuredClone(seedAudit);
		this.stats = structuredClone(seedStats);
		this.statsConfig = structuredClone(seedStatsConfig);
		this.settings = structuredClone(seedSettings);
		this.prefs = structuredClone(seedPrefs);
		this.scores = [];
		this.persistAll();
		write<Meta>(storageKeys.meta, { seedVersion: SEED_VERSION, createdAt: nowIso(), lastResetAt: nowIso() });
		i18n.englishEnabled = this.settings.englishEnabled;
		this.loaded = true;
	}

	private persist(key: StorageKey, value: unknown): boolean {
		return write(key, $state.snapshot(value));
	}

	/** Lädt die Dateipakete aus IndexedDB und zieht alte localStorage-Daten dorthin um. */
	private async hydrateGameFiles(): Promise<void> {
		try {
			const stored = await loadAllGameFiles();
			let migrate = false;
			for (const game of this.games) {
				const files = stored.get(game.id);
				if (files) game.files = files;
				else if (game.files?.length) migrate = true;
			}
			const packagesChanged = this.syncPackages();
			const loaded = await this.loadPackageFiles();
			this.gameFilesReady = true;
			if (migrate || packagesChanged || loaded) await this.persistGames();
		} catch {
			// Ohne IndexedDB: Dateien stehen (wie bisher) direkt im localStorage.
			this.filesInIdb = false;
			this.syncPackages();
			await this.loadPackageFiles();
			this.gameFilesReady = true;
		}
	}

	/** Spiel-Datensatz aus einem Paket in games/ (Einstellungen aus game.json). */
	private gameFromPackage(pkg: (typeof packagedGames)[number]): Game {
		const m = pkg.manifest as GameManifest;
		return {
			id: m.id,
			topicId: this.resolveTopic(m),
			lang: m.lang ?? 'de',
			translationOf: m.translationOf,
			title: m.title,
			description: m.description ?? '',
			kind: 'html',
			files: [],
			maxPoints: m.maxPoints,
			apiVersion: 1,
			triggerWarning: m.triggerWarning ?? true,
			published: m.published ?? true,
			package: { url: pkg.url, version: pkg.version, source: pkg.source },
			createdAt: nowIso(),
			updatedAt: nowIso()
		};
	}

	/** "kategorie/thema" (oder topicId) → interne Themen-ID. */
	resolveTopic(m: GameManifest): string {
		if (m.topicId && this.getTopic(m.topicId)) return m.topicId;
		if (m.topic) {
			const [categorySlug, topicSlug] = m.topic.split('/');
			const category = this.categories.find((c) => c.slug === categorySlug);
			const topic = this.topics.find((t) => t.categoryId === category?.id && t.slug === topicSlug);
			if (topic) return topic.id;
		}
		console.warn(`Spielpaket „${m.id}“: Thema „${m.topic ?? m.topicId}“ nicht gefunden.`);
		return m.topicId ?? '';
	}

	/**
	 * Pakete aus games/ mit dem Bestand abgleichen: neue anlegen, bei geänderter
	 * Version Einstellungen übernehmen und Dateien neu laden.
	 * @returns true, wenn sich etwas geändert hat
	 */
	private syncPackages(): boolean {
		let changed = false;
		for (const pkg of packagedGames) {
			const index = this.games.findIndex((g) => g.id === pkg.id);
			if (index < 0) {
				this.games.push(this.gameFromPackage(pkg));
				changed = true;
			} else if (this.games[index].package?.version !== pkg.version) {
				const fresh = this.gameFromPackage(pkg);
				this.games[index] = { ...fresh, createdAt: this.games[index].createdAt };
				changed = true;
			}
		}
		return changed;
	}

	/**
	 * Lädt die Dateien aller Pakete, die noch keine haben, aus ihrem ZIP.
	 * @returns true, wenn Dateien geladen wurden
	 */
	private async loadPackageFiles(): Promise<boolean> {
		let loaded = false;
		for (const game of this.games) {
			if (!game.package || game.files?.length) continue;
			try {
				const response = await fetch(withBase(game.package.url));
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				game.files = readZipPackage(await response.arrayBuffer()).files;
				loaded = true;
			} catch (error) {
				console.warn(`Spielpaket „${game.id}“ konnte nicht geladen werden:`, error);
			}
		}
		return loaded;
	}

	persistAll(): void {
		this.persist(storageKeys.categories, this.categories);
		this.persist(storageKeys.topics, this.topics);
		this.persist(storageKeys.fields, this.fields);
		this.persist(storageKeys.exhibitions, this.exhibitions);
		this.persist(storageKeys.publications, this.publications);
		this.persist(storageKeys.keywords, this.keywords);
		this.persist(storageKeys.media, this.media);
		this.persist(storageKeys.infographics, this.infographics);
		this.persist(storageKeys.quizzes, this.quizzes);
		void this.persistGames();
		this.persist(storageKeys.users, this.users);
		this.persist(storageKeys.audit, this.audit);
		this.persist(storageKeys.stats, this.stats);
		this.persist(storageKeys.statsConfig, this.statsConfig);
		this.persistSettings();
	}

	persistStructure(): void {
		this.persist(storageKeys.categories, this.categories);
		this.persist(storageKeys.topics, this.topics);
		this.persist(storageKeys.fields, this.fields);
	}
	persistExhibitions(): boolean {
		return this.persist(storageKeys.exhibitions, this.exhibitions);
	}
	persistPublications(): void {
		this.persist(storageKeys.publications, this.publications);
	}
	persistKeywords(): void {
		this.persist(storageKeys.keywords, this.keywords);
	}
	persistMedia(): boolean {
		return this.persist(storageKeys.media, this.media);
	}
	persistInfographics(): void {
		this.persist(storageKeys.infographics, this.infographics);
	}
	persistQuizzes(): boolean {
		return this.persist(storageKeys.quizzes, this.quizzes);
	}
	/** Metadaten in den localStorage, Dateipakete in IndexedDB. */
	async persistGames(): Promise<boolean> {
		// Nie speichern, bevor die Dateien geladen sind – sonst würden sie überschrieben.
		if (!this.gameFilesReady) await this.filesLoading;
		const games = $state.snapshot(this.games) as Game[];
		if (!this.filesInIdb) return write(storageKeys.games, games);
		try {
			await replaceAllGameFiles(games.map((game) => ({ id: game.id, files: game.files ?? [] })));
		} catch {
			return false;
		}
		return write(
			storageKeys.games,
			games.map((game) => ({ ...game, files: [] }))
		);
	}
	persistUsers(): void {
		this.persist(storageKeys.users, this.users);
	}
	persistStats(): void {
		this.persist(storageKeys.stats, this.stats);
		this.persist(storageKeys.statsConfig, this.statsConfig);
	}
	persistSettings(): void {
		this.persist(storageKeys.settings, this.settings);
		this.persist(storageKeys.prefs, this.prefs);
		i18n.englishEnabled = this.settings.englishEnabled;
	}

	/* -------------------------------------------------------------- */
	/* Lesen                                                           */
	/* -------------------------------------------------------------- */

	getCategory = (id: string | undefined) => this.categories.find((c) => c.id === id);
	getCategoryBySlug = (slug: string) => this.categories.find((c) => c.slug === slug);
	getTopic = (id: string | undefined) => this.topics.find((t) => t.id === id);
	getField = (id: string | undefined) => this.fields.find((f) => f.id === id);
	getExhibition = (id: string | undefined) => this.exhibitions.find((e) => e.id === id);
	getExhibitionBySlug = (slug: string) => this.exhibitions.find((e) => e.slug === slug);
	getPublication = (id: string | undefined) => this.publications.find((p) => p.id === id);
	getKeyword = (id: string | undefined) => this.keywords.find((k) => k.id === id);
	getMedia = (id: string | undefined) => (id ? this.media.find((m) => m.id === id) : undefined);
	getInfographic = (id: string | undefined) => this.infographics.find((i) => i.id === id);
	getQuiz = (id: string | undefined) => this.quizzes.find((q) => q.id === id);
	getGame = (id: string | undefined) => this.games.find((g) => g.id === id);
	getUser = (id: string | undefined) => this.users.find((u) => u.id === id);

	/** Öffentlich sichtbar: Kategorie und Thema aktiv, Ausstellung veröffentlicht. */
	isPublic(exhibition: Exhibition): boolean {
		if (exhibition.status !== 'published') return false;
		const topic = this.getTopic(exhibition.topicId);
		const category = this.getCategory(topic?.categoryId);
		return Boolean(topic?.active && category?.active);
	}

	activeCategories(): Category[] {
		return [...this.categories].filter((c) => c.active).sort((a, b) => a.order - b.order);
	}

	topicsOf(categoryId: string, onlyActive = true): Topic[] {
		return this.topics
			.filter((t) => t.categoryId === categoryId && (!onlyActive || t.active))
			.sort((a, b) => a.order - b.order);
	}

	publicExhibitions(): Exhibition[] {
		return this.exhibitions
			.filter((e) => this.isPublic(e))
			.sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
	}

	exhibitionsOfTopic(topicId: string): Exhibition[] {
		return this.publicExhibitions().filter((e) => e.topicId === topicId);
	}

	exhibitionsOfCategory(categoryId: string): Exhibition[] {
		const ids = new Set(this.topicsOf(categoryId).map((t) => t.id));
		return this.publicExhibitions().filter((e) => ids.has(e.topicId));
	}

	categoryOfExhibition(exhibition: Exhibition): Category | undefined {
		return this.getCategory(this.getTopic(exhibition.topicId)?.categoryId);
	}

	/** Quiz in der passenden Sprache, sonst das Original. */
	quizForLocale(quizId: string, locale: Locale): Quiz | undefined {
		const base = this.getQuiz(quizId);
		if (!base) return undefined;
		if ((base.lang ?? 'de') === locale) return base;
		const originalId = base.translationOf ?? base.id;
		return (
			this.quizzes.find((q) => q.published && (q.lang ?? 'de') === locale && (q.translationOf === originalId || q.id === originalId)) ??
			base
		);
	}

	/** Spiel in der passenden Sprache, sonst das Original – wie bei Quizzen. */
	gameForLocale(gameId: string, locale: Locale): Game | undefined {
		return this.forLocale(this.games, this.getGame(gameId), locale);
	}

	private forLocale<T extends ActivityBase>(list: T[], base: T | undefined, locale: Locale): T | undefined {
		if (!base) return undefined;
		if ((base.lang ?? 'de') === locale) return base;
		const originalId = base.translationOf ?? base.id;
		return (
			list.find(
				(x) => x.published && (x.lang ?? 'de') === locale && (x.translationOf === originalId || x.id === originalId)
			) ?? base
		);
	}

	/**
	 * Quizze und Spiele gemeinsam – gleichrangig, geordnet nach Kategorie und Thema.
	 * Nur veröffentlichte Originale aktiver Themen, jeweils in der passenden Sprache.
	 * Ist die Gamification ausgeschaltet, bleibt die Liste leer.
	 */
	activities(filter: { categoryId?: string; topicId?: string } = {}, locale: Locale = i18n.active): Activity[] {
		if (!this.settings.gamification) return [];
		const topicOk = (topicId: string) => {
			const topic = this.getTopic(topicId);
			if (!topic?.active) return false;
			if (filter.topicId && topic.id !== filter.topicId) return false;
			if (filter.categoryId && topic.categoryId !== filter.categoryId) return false;
			return true;
		};
		const quizzes: Activity[] = this.quizzes
			.filter((q) => q.published && !q.translationOf && topicOk(q.topicId))
			.map((q) => this.quizForLocale(q.id, locale) ?? q)
			.map((item) => ({ kind: 'quiz', item, href: `/quiz/${item.id}` }));
		const games: Activity[] = this.games
			.filter((g) => g.published && !g.translationOf && topicOk(g.topicId))
			.map((g) => this.gameForLocale(g.id, locale) ?? g)
			.map((item) => ({ kind: 'game', item, href: `/spielen/${item.id}` }));
		const rank = (a: Activity) => {
			const topic = this.getTopic(a.item.topicId);
			const category = this.getCategory(topic?.categoryId);
			return [category?.order ?? 999, topic?.order ?? 999] as const;
		};
		return [...quizzes, ...games].sort((a, b) => {
			const [ca, ta] = rank(a);
			const [cb, tb] = rank(b);
			return ca - cb || ta - tb || a.item.title.localeCompare(b.item.title, locale);
		});
	}

	/** Ausstellung, in der ein Quiz oder Spiel eingebunden ist. */
	exhibitionWith(ref: { quizId?: string; gameId?: string }): Exhibition | undefined {
		// Eingebunden ist immer das Original; Übersetzungen finden so dieselbe Ausstellung.
		const quiz = ref.quizId ? this.getQuiz(ref.quizId) : undefined;
		const game = ref.gameId ? this.getGame(ref.gameId) : undefined;
		const quizIds = new Set([ref.quizId, quiz?.translationOf].filter(Boolean));
		const gameIds = new Set([ref.gameId, game?.translationOf].filter(Boolean));
		return this.exhibitions.find((e) =>
			e.blocks.some(
				(b) => (b.type === 'quiz' && quizIds.has(b.quizId)) || (b.type === 'game' && gameIds.has(b.gameId))
			)
		);
	}

	mediaUsage(mediaId: string): string[] {
		const out: string[] = [];
		for (const e of this.exhibitions) {
			const used =
				e.heroMediaId === mediaId ||
				e.blocks.some((b) => (b.type === 'media' && b.mediaId === mediaId) || (b.type === 'gallery' && b.mediaIds.includes(mediaId)));
			if (used) out.push(e.title.de);
		}
		for (const p of this.publications) if (p.mediaIds.includes(mediaId)) out.push(`Publikation: ${p.title}`);
		for (const c of this.categories) if (c.imageId === mediaId) out.push(`Kategorie: ${c.title.de}`);
		for (const i of this.infographics) if (i.imageId === mediaId) out.push(`Infografik: ${i.title.de}`);
		return out;
	}

	keywordUsage(keywordId: string): number {
		return (
			this.exhibitions.filter((e) => e.keywordIds.includes(keywordId)).length +
			this.publications.filter((p) => p.keywordIds.includes(keywordId)).length
		);
	}

	/** Darf das Medium heruntergeladen werden? (LB 5.3, restriktive Downloadbereitstellung) */
	canDownload(media: MediaItem): boolean {
		if (this.settings.downloads === 'none') return false;
		if (this.settings.downloads === 'all') return true;
		return media.downloadable;
	}

	/* -------------------------------------------------------------- */
	/* Suche (LB 5.2)                                                  */
	/* -------------------------------------------------------------- */

	search(query: SearchQuery): SearchHit[] {
		const locale = i18n.active;
		const terms = query.q.toLowerCase().split(/\s+/).filter(Boolean);
		const hits: SearchHit[] = [];

		const scoreOf = (title: string, keywords: string, summary: string, full: string): number => {
			if (!terms.length) return 1;
			let score = 0;
			for (const term of terms) {
				let s = 0;
				if (title.includes(term)) s += 10;
				if (keywords.includes(term)) s += 6;
				if (summary.includes(term)) s += 3;
				if (full.includes(term)) s += 1;
				if (!s) return 0;
				score += s;
			}
			return score;
		};

		const keywordText = (ids: string[]) => ids.map((id) => flat(this.getKeyword(id)?.label)).join(' ');

		if (!query.type || query.type === 'exhibition') {
			for (const e of this.publicExhibitions()) {
				if (query.keywordId && !e.keywordIds.includes(query.keywordId)) continue;
				if (query.audience && !e.audiences.includes(query.audience)) continue;
				const topic = this.getTopic(e.topicId);
				if (query.categoryId && topic?.categoryId !== query.categoryId) continue;
				if (query.fieldId && topic?.fieldId !== query.fieldId) continue;
				const pubs = e.publicationIds.map((id) => this.getPublication(id)?.title ?? '').join(' ').toLowerCase();
				const score = scoreOf(
					flat(e.title),
					keywordText(e.keywordIds) + ' ' + flat(topic?.title),
					flat(e.teaser),
					e.blocks.map(blockText).join(' ') + ' ' + pubs
				);
				if (!score) continue;
				hits.push({
					type: 'exhibition',
					id: e.id,
					title: i18n.tr(e.title),
					titleLang: i18n.langOf(e.title),
					text: i18n.tr(e.teaser),
					href: `/ausstellung/${e.slug}`,
					date: e.publishedAt ?? e.updatedAt,
					categoryId: topic?.categoryId,
					topicId: e.topicId,
					fieldId: topic?.fieldId,
					score,
					mediaId: e.heroMediaId
				});
			}
		}

		if ((!query.type || query.type === 'publication') && !query.audience) {
			for (const p of this.publications) {
				const exhibition = this.publicExhibitions().find((e) => e.publicationIds.includes(p.id));
				if (!exhibition) continue;
				if (query.keywordId && !p.keywordIds.includes(query.keywordId)) continue;
				const topic = this.getTopic(exhibition.topicId);
				if (query.categoryId && topic?.categoryId !== query.categoryId) continue;
				if (query.fieldId && topic?.fieldId !== query.fieldId) continue;
				const score = scoreOf(
					p.title.toLowerCase(),
					keywordText(p.keywordIds) + ' ' + p.authors.join(' ').toLowerCase(),
					flat(p.summary),
					p.citation.toLowerCase()
				);
				if (!score) continue;
				hits.push({
					type: 'publication',
					id: p.id,
					title: p.title,
					titleLang: 'de',
					text: `${p.authors.join(', ')} · ${i18n.tr(p.summary)}`,
					href: `/ausstellung/${exhibition.slug}#publikationen`,
					date: p.date,
					categoryId: topic?.categoryId,
					topicId: exhibition.topicId,
					fieldId: topic?.fieldId,
					score: score * 0.9
				});
			}
		}

		if ((!query.type || query.type === 'quiz') && this.settings.gamification && !query.keywordId && (!query.audience || query.audience === 'schule')) {
			for (const q of this.quizzes.filter((q) => q.published && (q.lang ?? 'de') === locale)) {
				const topic = this.getTopic(q.topicId);
				if (!topic?.active) continue;
				if (query.categoryId && topic.categoryId !== query.categoryId) continue;
				if (query.fieldId && topic.fieldId !== query.fieldId) continue;
				const score = scoreOf(q.title.toLowerCase(), flat(topic.title), q.description.toLowerCase(), q.questions.map((x) => x.prompt).join(' ').toLowerCase());
				if (!score) continue;
				hits.push({
					type: 'quiz',
					id: q.id,
					title: q.title,
					titleLang: q.lang ?? 'de',
					text: q.description,
					href: `/quiz/${q.id}`,
					date: q.updatedAt,
					categoryId: topic.categoryId,
					topicId: topic.id,
					fieldId: topic.fieldId,
					score: score * 0.8
				});
			}
		}

		const byTitle = (a: SearchHit, b: SearchHit) => a.title.localeCompare(b.title, locale);
		const byDate = (a: SearchHit, b: SearchHit) => b.date.localeCompare(a.date);
		if (query.sort === 'date') return hits.sort(byDate);
		if (query.sort === 'title') return hits.sort(byTitle);
		return hits.sort((a, b) => b.score - a.score || byDate(a, b));
	}

	/* -------------------------------------------------------------- */
	/* Struktur                                                        */
	/* -------------------------------------------------------------- */

	addCategory(): Category {
		const category: Category = {
			id: uid(),
			slug: `kategorie-${this.categories.length + 1}`,
			title: { de: 'Neue Kategorie', en: '' },
			description: empty(),
			icon: 'pets',
			color: 'forest',
			order: this.categories.length + 1,
			active: false
		};
		this.categories.push(category);
		this.persistStructure();
		return category;
	}

	addTopic(categoryId: string): Topic {
		const topic: Topic = {
			id: uid(),
			categoryId,
			slug: `thema-${this.topics.length + 1}`,
			title: { de: 'Neuer Themenschwerpunkt', en: '' },
			description: empty(),
			fieldId: this.fields[0]?.id ?? '',
			order: this.topicsOf(categoryId, false).length + 1,
			active: false
		};
		this.topics.push(topic);
		this.persistStructure();
		return topic;
	}

	move<T extends { id: string; order: number }>(list: T[], id: string, dir: -1 | 1): void {
		const sorted = [...list].sort((a, b) => a.order - b.order);
		const i = sorted.findIndex((x) => x.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= sorted.length) return;
		[sorted[i].order, sorted[j].order] = [sorted[j].order, sorted[i].order];
		sorted.forEach((x, k) => (x.order = k + 1));
		this.persistStructure();
	}

	deleteCategory(id: string): boolean {
		if (this.topics.some((t) => t.categoryId === id)) return false;
		this.categories = this.categories.filter((c) => c.id !== id);
		this.persistStructure();
		return true;
	}

	deleteTopic(id: string): boolean {
		if (this.exhibitions.some((e) => e.topicId === id)) return false;
		this.topics = this.topics.filter((t) => t.id !== id);
		this.persistStructure();
		return true;
	}

	/* -------------------------------------------------------------- */
	/* Ausstellungen, Workflow, Versionen (LB 6)                       */
	/* -------------------------------------------------------------- */

	createExhibition(topicId: string, authorId: string): Exhibition {
		const e: Exhibition = {
			id: uid(),
			slug: `ausstellung-${Date.now().toString(36)}`,
			topicId,
			title: { de: 'Neue Ausstellung', en: '' },
			teaser: empty(),
			blocks: [{ id: uid(), type: 'text', heading: empty(), body: empty() }],
			publicationIds: [],
			keywordIds: [],
			audiences: ['allgemein'],
			readingMinutes: 3,
			status: 'draft',
			authorId,
			createdAt: nowIso(),
			updatedAt: nowIso(),
			versions: []
		};
		this.exhibitions.push(e);
		this.snapshot(e, authorId, 'Angelegt');
		this.persistExhibitions();
		return e;
	}

	/** Speichert eine neue Version (nachvollziehbare Historie). */
	snapshot(e: Exhibition, userId: string, note: string): void {
		const { versions: _v, ...rest } = $state.snapshot(e) as Exhibition;
		e.versions = [{ id: uid(), at: nowIso(), by: userId, note, snapshot: structuredClone(rest) }, ...e.versions].slice(0, 30);
	}

	saveExhibition(draft: Exhibition, userId: string, note = 'Gespeichert'): boolean {
		draft.updatedAt = nowIso();
		const idx = this.exhibitions.findIndex((e) => e.id === draft.id);
		const copy = structuredClone($state.snapshot(draft)) as Exhibition;
		if (idx >= 0) {
			copy.versions = this.exhibitions[idx].versions;
			this.exhibitions[idx] = copy;
		} else this.exhibitions.push(copy);
		const stored = this.getExhibition(draft.id)!;
		this.snapshot(stored, userId, note);
		draft.versions = stored.versions;
		return this.persistExhibitions();
	}

	setStatus(id: string, status: Status, userId: string, note?: string): void {
		const e = this.getExhibition(id);
		if (!e) return;
		e.status = status;
		e.updatedAt = nowIso();
		if (status === 'published') e.publishedAt = nowIso();
		if (note !== undefined) e.reviewNote = note;
		const label: Record<Status, string> = {
			draft: 'Zurück in Bearbeitung',
			review: 'Zur Prüfung eingereicht',
			published: 'Veröffentlicht',
			archived: 'Archiviert'
		};
		this.snapshot(e, userId, label[status] + (note ? `: ${note}` : ''));
		this.persistExhibitions();
		this.log(userId, label[status], e.title.de);
	}

	restoreVersion(id: string, versionId: string, userId: string): void {
		const e = this.getExhibition(id);
		const v = e?.versions.find((x) => x.id === versionId);
		if (!e || !v) return;
		const versions = e.versions;
		Object.assign(e, structuredClone(v.snapshot), { versions, status: 'draft', updatedAt: nowIso() });
		this.snapshot(e, userId, `Version vom ${new Date(v.at).toLocaleString('de-DE')} wiederhergestellt`);
		this.persistExhibitions();
		this.log(userId, 'Version wiederhergestellt', e.title.de);
	}

	deleteExhibition(id: string, userId: string): void {
		const e = this.getExhibition(id);
		this.exhibitions = this.exhibitions.filter((x) => x.id !== id);
		this.persistExhibitions();
		this.log(userId, 'Ausstellung gelöscht', e?.title.de, 'security');
	}

	/* -------------------------------------------------------------- */
	/* Publikationen, Schlagwörter, Medien, Infografiken               */
	/* -------------------------------------------------------------- */

	createPublication(): Publication {
		const p: Publication = {
			id: uid(),
			title: 'Neue Publikation',
			authors: [],
			date: nowIso().slice(0, 10),
			summary: empty(),
			keywordIds: [],
			citation: '',
			url: '',
			mediaIds: [],
			createdAt: nowIso(),
			updatedAt: nowIso()
		};
		this.publications.unshift(p);
		this.persistPublications();
		return p;
	}

	deletePublication(id: string): void {
		this.publications = this.publications.filter((p) => p.id !== id);
		for (const e of this.exhibitions) e.publicationIds = e.publicationIds.filter((x) => x !== id);
		this.persistPublications();
		this.persistExhibitions();
	}

	addKeyword(de: string, en = ''): Keyword | null {
		const label = de.trim();
		if (!label) return null;
		const existing = this.keywords.find((k) => k.label.de.toLowerCase() === label.toLowerCase());
		if (existing) return existing;
		const k: Keyword = { id: uid(), label: { de: label, en: en.trim() } };
		this.keywords.push(k);
		this.persistKeywords();
		return k;
	}

	deleteKeyword(id: string): void {
		this.keywords = this.keywords.filter((k) => k.id !== id);
		for (const e of this.exhibitions) e.keywordIds = e.keywordIds.filter((x) => x !== id);
		for (const p of this.publications) p.keywordIds = p.keywordIds.filter((x) => x !== id);
		this.persistAll();
	}

	addMedia(item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>): MediaItem | null {
		const m: MediaItem = { ...item, id: uid(), createdAt: nowIso(), updatedAt: nowIso() };
		this.media.unshift(m);
		if (!this.persistMedia()) {
			this.media.shift();
			return null;
		}
		return m;
	}

	deleteMedia(id: string): boolean {
		if (this.mediaUsage(id).length) return false;
		this.media = this.media.filter((m) => m.id !== id);
		this.persistMedia();
		return true;
	}

	createInfographic(kind: Infographic['kind']): Infographic {
		const i: Infographic = {
			id: uid(),
			kind,
			title: { de: kind === 'bars' ? 'Neues Balkendiagramm' : 'Neues Bild mit Hotspots', en: '' },
			description: empty(),
			unit: empty(),
			bars: kind === 'bars' ? [{ id: uid(), label: { de: 'Wert A', en: '' }, value: 50, note: empty() }] : undefined,
			hotspots: kind === 'hotspots' ? [] : undefined,
			imageId: kind === 'hotspots' ? this.media.find((m) => m.type === 'image')?.id : undefined,
			createdAt: nowIso(),
			updatedAt: nowIso()
		};
		this.infographics.push(i);
		this.persistInfographics();
		return i;
	}

	/* -------------------------------------------------------------- */
	/* Quiz und Spiele                                                 */
	/* -------------------------------------------------------------- */

	quizzesForTopic(topicId: string): Quiz[] {
		return this.quizzes.filter((q) => q.topicId === topicId && q.published);
	}

	gamesForTopic(topicId: string): Game[] {
		return this.games.filter((g) => g.topicId === topicId && g.published);
	}

	updateQuiz(quiz: Quiz): boolean {
		quiz.updatedAt = nowIso();
		const idx = this.quizzes.findIndex((q) => q.id === quiz.id);
		if (idx >= 0) this.quizzes[idx] = quiz;
		else this.quizzes.push(quiz);
		return this.persistQuizzes();
	}

	createQuiz(topicId: string): Quiz {
		const quiz: Quiz = {
			id: uid(),
			topicId,
			lang: 'de',
			title: 'Neues Quiz',
			description: '',
			questions: [],
			published: false,
			timerSeconds: null,
			createdAt: nowIso(),
			updatedAt: nowIso()
		};
		this.quizzes.push(quiz);
		this.persistQuizzes();
		return quiz;
	}

	deleteQuiz(id: string): void {
		this.quizzes = this.quizzes.filter((q) => q.id !== id);
		this.persistQuizzes();
	}

	updateGame(game: Game): Promise<boolean> {
		game.updatedAt = nowIso();
		const idx = this.games.findIndex((g) => g.id === game.id);
		if (idx >= 0) this.games[idx] = game;
		else this.games.push(game);
		return this.persistGames();
	}

	createGame(input: Partial<Game> = {}): Game {
		const game: Game = {
			id: uid(),
			topicId: input.topicId ?? this.topics[0]?.id ?? '',
			lang: input.lang ?? 'de',
			translationOf: input.translationOf,
			title: input.title ?? 'Neues HTML-Spiel',
			description: input.description ?? '',
			kind: 'html',
			files: input.files?.length ? structuredClone(input.files) : starterFiles(),
			maxPoints: input.maxPoints ?? 100,
			apiVersion: 1,
			triggerWarning: input.triggerWarning ?? true,
			published: false,
			createdAt: nowIso(),
			updatedAt: nowIso()
		};
		this.games.push(game);
		void this.persistGames();
		return game;
	}

	deleteGame(id: string): void {
		this.games = this.games.filter((g) => g.id !== id);
		void this.persistGames();
	}

	/** Wird vom Quiz-Player und Spiel-Host aufgerufen. */
	addScore(input: Omit<Score, 'id' | 'at'>): Score {
		const entry: Score = { ...input, id: uid(), at: nowIso() };
		this.scores = [entry, ...this.scores].slice(0, 500);
		if (input.refType === 'quiz') this.trackQuizComplete(input.refId, input.maxPoints ? input.points / input.maxPoints : 0);
		passHook?.(entry);
		return entry;
	}

	pointsOf(playerId: string): number {
		return this.scores.filter((s) => s.playerId === playerId).reduce((sum, s) => sum + s.points, 0);
	}

	/* -------------------------------------------------------------- */
	/* Benutzer und Protokoll                                          */
	/* -------------------------------------------------------------- */

	log(userId: string, action: string, target?: string, level: AuditEntry['level'] = 'info'): void {
		this.audit = [{ id: uid(), at: nowIso(), userId, action, target, level }, ...this.audit].slice(0, 300);
		this.persist(storageKeys.audit, this.audit);
	}

	/* -------------------------------------------------------------- */
	/* Statistik (LB 10): nur Zähler, keine Personendaten, keine Cookies */
	/* -------------------------------------------------------------- */

	private bump(map: Record<string, number>, key: string, by = 1): void {
		map[key] = (map[key] ?? 0) + by;
	}

	trackPage(ref: { exhibitionId?: string; categoryId?: string }): void {
		if (!this.loaded) return;
		const day = nowIso().slice(0, 10);
		if (this.statsConfig.pageviews) this.bump(this.stats.daily, day);
		if (this.statsConfig.topics) {
			if (ref.exhibitionId) this.bump(this.stats.exhibitions, ref.exhibitionId);
			if (ref.categoryId) this.bump(this.stats.categories, ref.categoryId);
		}
		this.persistStats();
	}

	trackSearch(term: string): void {
		const clean = term.trim().toLowerCase();
		if (!this.statsConfig.searchTerms || clean.length < 3) return;
		this.bump(this.stats.searches, clean.slice(0, 40));
		this.persistStats();
	}

	trackQuizStart(quizId: string): void {
		if (!this.statsConfig.interactions) return;
		this.bump(this.stats.quizStarts, quizId);
		this.persistStats();
	}

	trackQuizComplete(quizId: string, ratio: number): void {
		if (this.statsConfig.interactions) this.bump(this.stats.quizCompletions, quizId);
		if (this.statsConfig.successRates) {
			const s = (this.stats.quizScore[quizId] ??= { sum: 0, n: 0 });
			s.sum += ratio;
			s.n += 1;
		}
		this.persistStats();
	}

	trackDwell(exhibitionId: string, seconds: number): void {
		if (!this.statsConfig.dwellTime || seconds < 3) return;
		const d = (this.stats.dwell[exhibitionId] ??= { sum: 0, n: 0 });
		d.sum += Math.min(seconds, 1800);
		d.n += 1;
		this.persistStats();
	}

	/** Dashboard-Liste der zuletzt geänderten Inhalte. */
	recentItems(): { id: string; title: string; type: string; updatedAt: string; href: string; status?: Status }[] {
		const exhibitions = this.exhibitions.map((e) => ({
			id: e.id,
			title: e.title.de,
			type: 'Ausstellung',
			updatedAt: e.updatedAt,
			href: `/admin/ausstellungen/${e.id}`,
			status: e.status
		}));
		const quizzes = this.quizzes.map((q) => ({
			id: q.id,
			title: q.title,
			type: 'Quiz',
			updatedAt: q.updatedAt,
			href: `/admin/quiz/${q.id}`
		}));
		return [...exhibitions, ...quizzes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
	}
}

/** Wird vom Forscherpass gesetzt, um Ergebnisse (nur mit Zustimmung) zu speichern. */
let passHook: ((score: Score) => void) | null = null;
export function setPassHook(fn: (score: Score) => void): void {
	passHook = fn;
}

export const content = new ContentStore();
