import { browser } from '$app/env';
import { storageKeys, read, write } from '$lib/storage/db';
import {
	SEED_VERSION,
	seedGames,
	seedModules,
	seedPlayers,
	seedQuizzes,
	seedScores,
	seedSettings
} from '$lib/storage/seed';
import type { Game, GameFile, Module, Player, Quiz, Score, Settings } from '$lib/types';
import { levelFor, nowIso, uid } from '$lib/utils';
import { starterIndexHtml } from '$lib/games/files';

type Meta = { seedVersion: number; createdAt: string; lastResetAt: string };

type LegacyGame = Game & { source?: string; files?: GameFile[] };

function normalizeGame(game: LegacyGame): Game {
	const files = game.files?.length
		? game.files
		: game.source
			? [
					{
						path: 'index.html',
						kind: 'html' as const,
						mime: 'text/html',
						encoding: 'utf8' as const,
						content: game.source,
						size: game.source.length
					}
				]
			: [];
	const { source: _legacySource, ...rest } = game;
	return { ...rest, kind: 'html', files } as Game;
}

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

class ContentStore {
	modules = $state<Module[]>([]);
	quizzes = $state<Quiz[]>([]);
	games = $state<Game[]>([]);
	players = $state<Player[]>([]);
	scores = $state<Score[]>([]);
	settings = $state<Settings>(seedSettings);
	loaded = $state(false);

	init(): void {
		if (!browser || this.loaded) return;
		const meta = read<Meta | null>(storageKeys.meta, null);
		const modules = read<Module[]>(storageKeys.modules, []);
		if (!meta || meta.seedVersion !== SEED_VERSION || modules.length === 0) {
			this.resetDemo();
		} else {
			this.modules = modules;
			this.quizzes = read(storageKeys.quizzes, []);
			this.games = read<Game[]>(storageKeys.games, []).map(normalizeGame);
			this.players = read(storageKeys.players, []);
			this.scores = read(storageKeys.scores, []);
			this.settings = read(storageKeys.settings, seedSettings);
		}
		this.loaded = true;
	}

	resetDemo(): void {
		this.modules = structuredClone(seedModules);
		this.quizzes = structuredClone(seedQuizzes);
		this.games = structuredClone(seedGames);
		this.players = structuredClone(seedPlayers);
		this.scores = structuredClone(seedScores);
		this.settings = structuredClone(seedSettings);

		write(storageKeys.modules, this.modules);
		write(storageKeys.quizzes, this.quizzes);
		write(storageKeys.games, this.games);
		write(storageKeys.players, this.players);
		write(storageKeys.scores, this.scores);
		write(storageKeys.settings, this.settings);
		write<Meta>(storageKeys.meta, {
			seedVersion: SEED_VERSION,
			createdAt: nowIso(),
			lastResetAt: nowIso()
		});
		this.loaded = true;
	}

	persistModules(): void {
		write(storageKeys.modules, this.modules);
	}
	persistQuizzes(): boolean {
		return write(storageKeys.quizzes, this.quizzes);
	}
	persistGames(): boolean {
		return write(storageKeys.games, this.games);
	}
	persistPlayers(): void {
		write(storageKeys.players, this.players);
	}
	persistScores(): void {
		write(storageKeys.scores, this.scores);
	}
	persistSettings(): void {
		write(storageKeys.settings, this.settings);
	}

	getModule(id: string): Module | undefined {
		return this.modules.find((m) => m.id === id);
	}

	getQuiz(id: string): Quiz | undefined {
		return this.quizzes.find((q) => q.id === id);
	}

	getGame(id: string): Game | undefined {
		return this.games.find((g) => g.id === id);
	}

	getPlayer(id: string): Player | undefined {
		return this.players.find((p) => p.id === id);
	}

	quizzesForModule(moduleId: string): Quiz[] {
		return this.quizzes.filter((q) => q.moduleId === moduleId && q.published);
	}

	gamesForModule(moduleId: string): Game[] {
		return this.games.filter((g) => g.moduleId === moduleId && g.published);
	}

	pointsOf(playerId: string): number {
		return this.scores
			.filter((s) => s.playerId === playerId)
			.reduce((sum, s) => sum + s.points, 0);
	}

	levelOf(playerId: string): string {
		return levelFor(
			this.pointsOf(playerId),
			this.settings.levelThresholds.forscherin,
			this.settings.levelThresholds.forscher
		);
	}

	leaderboard(): { player: Player; points: number }[] {
		return this.players
			.map((player) => ({ player, points: this.pointsOf(player.id) }))
			.sort((a, b) => b.points - a.points);
	}

	moduleProgress(moduleId: string, playerId: string): number {
		const quizIds = this.quizzesForModule(moduleId).map((q) => q.id);
		const gameIds = this.gamesForModule(moduleId).map((g) => g.id);
		const total = quizIds.length + gameIds.length;
		if (!total) return 0;
		const done = this.scores.filter(
			(s) =>
				s.playerId === playerId &&
				((s.refType === 'quiz' && quizIds.includes(s.refId)) ||
					(s.refType === 'game' && gameIds.includes(s.refId)))
		).length;
		return Math.round((Math.min(done, total) / total) * 100);
	}

	addScore(input: {
		playerId: string;
		refType: 'quiz' | 'game';
		refId: string;
		points: number;
		maxPoints: number;
		durationMs: number;
	}): Score {
		const entry: Score = { ...input, id: uid(), at: nowIso() };
		this.scores = [entry, ...this.scores].slice(0, 500);
		this.persistScores();
		return entry;
	}

	updateQuiz(quiz: Quiz): boolean {
		quiz.updatedAt = nowIso();
		const idx = this.quizzes.findIndex((q) => q.id === quiz.id);
		if (idx >= 0) this.quizzes[idx] = quiz;
		else this.quizzes.push(quiz);
		return this.persistQuizzes();
	}

	createQuiz(moduleId: string): Quiz {
		const quiz: Quiz = {
			id: uid(),
			moduleId,
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

	updateGame(game: Game): boolean {
		game.updatedAt = nowIso();
		const idx = this.games.findIndex((g) => g.id === game.id);
		if (idx >= 0) this.games[idx] = game;
		else this.games.push(game);
		return this.persistGames();
	}

	createGame(input: Partial<Game> = {}): Game {
		const game: Game = {
			id: uid(),
			moduleId: input.moduleId ?? this.modules[0]?.id ?? '',
			title: input.title ?? 'Neues HTML-Spiel',
			description: input.description ?? '',
			kind: 'html',
			files: input.files?.length ? structuredClone(input.files) : starterFiles(),
			maxPoints: input.maxPoints ?? 100,
			apiVersion: 1,
			published: false,
			createdAt: nowIso(),
			updatedAt: nowIso()
		};
		this.games.push(game);
		this.persistGames();
		return game;
	}

	deleteGame(id: string): void {
		this.games = this.games.filter((g) => g.id !== id);
		this.persistGames();
	}

	updatePlayer(player: Player): void {
		const idx = this.players.findIndex((p) => p.id === player.id);
		if (idx >= 0) this.players[idx] = player;
		this.persistPlayers();
	}

	addPlayer(name: string, avatar: string): Player {
		const player: Player = {
			id: uid(),
			name,
			avatar,
			createdAt: nowIso(),
			lastActiveAt: nowIso()
		};
		this.players.push(player);
		this.persistPlayers();
		return player;
	}

	deletePlayer(id: string): void {
		this.players = this.players.filter((p) => p.id !== id);
		this.scores = this.scores.filter((s) => s.playerId !== id);
		this.persistPlayers();
		this.persistScores();
	}

	resetScores(playerId?: string): void {
		this.scores = playerId ? this.scores.filter((s) => s.playerId !== playerId) : [];
		this.persistScores();
	}

	recentItems(): { id: string; title: string; type: string; updatedAt: string; href: string }[] {
		const quizzes = this.quizzes.map((q) => ({
			id: q.id,
			title: q.title,
			type: 'Quiz',
			updatedAt: q.updatedAt,
			href: `/admin/quiz/${q.id}`
		}));
		const games = this.games.map((g) => ({
			id: g.id,
			title: g.title,
			type: 'HTML-Spiel',
			updatedAt: g.updatedAt,
			href: `/admin/spiele/${g.id}`
		}));
		return [...quizzes, ...games]
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
			.slice(0, 6);
	}
}

export const content = new ContentStore();
