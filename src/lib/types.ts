export type ID = string;

export type ModuleColor = 'forest' | 'amber' | 'sky' | 'berry';

export type Module = {
	id: ID;
	title: string;
	subtitle: string;
	description: string;
	emoji: string;
	color: ModuleColor;
	published: boolean;
	order: number;
};

export type Player = {
	id: ID;
	name: string;
	avatar: string;
	createdAt: string;
	lastActiveAt: string;
};

export type Score = {
	id: ID;
	playerId: ID;
	refType: 'quiz' | 'game';
	refId: ID;
	points: number;
	maxPoints: number;
	durationMs: number;
	at: string;
};

type QuestionBase = {
	id: ID;
	prompt: string;
	explanation?: string;
	points: number;
	image?: string;
};

export type McQuestion = QuestionBase & {
	type: 'mc';
	options: { id: ID; text: string; correct: boolean }[];
	multiple: boolean;
};

export type TfQuestion = QuestionBase & {
	type: 'tf';
	correct: boolean;
};

export type ImageQuestion = QuestionBase & {
	type: 'image';
	mode: 'choice' | 'input' | 'click';
	options?: { id: ID; text: string; correct: boolean }[];
	answer?: string;
	tolerance?: 'exact' | 'loose';
	clickInstruction?: string;
	clickPolygon?: { x: number; y: number }[];
};

export type MatchQuestion = QuestionBase & {
	type: 'match';
	left: { id: ID; text: string }[];
	right: { id: ID; text: string }[];
	solution: { leftId: ID; rightId: ID }[];
};

export type Question = McQuestion | TfQuestion | ImageQuestion | MatchQuestion;

export type Quiz = {
	id: ID;
	moduleId: ID;
	title: string;
	description: string;
	questions: Question[];
	published: boolean;
	timerSeconds: number | null;
	createdAt: string;
	updatedAt: string;
};

export type GameFileKind = 'html' | 'css' | 'js' | 'image' | 'audio' | 'video';

export type GameFile = {
	/** Pfad innerhalb des ZIP-Pakets, z. B. "assets/bild.png". */
	path: string;
	kind: GameFileKind;
	mime: string;
	encoding: 'utf8' | 'base64';
	/** Quelltext bei utf8, Base64 bei Binärdateien. */
	content: string;
	size: number;
};

export type Game = {
	id: ID;
	moduleId: ID;
	title: string;
	description: string;
	/** HTML-Spiele werden immer als Dateipaket gepflegt (ZIP-Upload). */
	kind: 'html';
	files: GameFile[];
	maxPoints: number;
	apiVersion: 1;
	/** Epilepsie-Triggerwarnung vor dem Start einblenden. */
	triggerWarning: boolean;
	published: boolean;
	createdAt: string;
	updatedAt: string;
};

export type Preferences = {
	/** Global vom Spieler bestätigt: Warnung nie wieder anzeigen. */
	hideTriggerWarnings: boolean;
};

export type Settings = {
	platformName: string;
	subtitle: string;
	pointsPerAnswer: number;
	levelThresholds: { forscher: number; forscherin: number };
	leaderboardPublic: boolean;
};

export type Session = {
	playerId: ID;
	startedAt: string;
	isAdmin: boolean;
};

export type LastResult = {
	refType: 'quiz' | 'game';
	refId: ID;
	title: string;
	points: number;
	maxPoints: number;
	correct: number;
	total: number;
	durationMs: number;
	at: string;
};

export const emptyQuestion = (type: Question['type']): Question => {
	const base = { id: crypto.randomUUID(), prompt: '', explanation: '', points: 10 };
	switch (type) {
		case 'mc':
			return {
				...base,
				type: 'mc',
				multiple: false,
				options: [
					{ id: crypto.randomUUID(), text: '', correct: true },
					{ id: crypto.randomUUID(), text: '', correct: false },
					{ id: crypto.randomUUID(), text: '', correct: false }
				]
			};
		case 'tf':
			return { ...base, type: 'tf', correct: true };
		case 'image':
			return {
				...base,
				type: 'image',
				mode: 'choice',
				options: [
					{ id: crypto.randomUUID(), text: '', correct: true },
					{ id: crypto.randomUUID(), text: '', correct: false },
					{ id: crypto.randomUUID(), text: '', correct: false }
				]
			};
		case 'match':
			return {
				...base,
				type: 'match',
				left: [
					{ id: crypto.randomUUID(), text: '' },
					{ id: crypto.randomUUID(), text: '' }
				],
				right: [
					{ id: crypto.randomUUID(), text: '' },
					{ id: crypto.randomUUID(), text: '' }
				],
				solution: []
			};
	}
};

export const questionTypeLabel: Record<Question['type'], string> = {
	mc: 'Multiple Choice',
	tf: 'Richtig/Falsch',
	image: 'Bilderrätsel',
	match: 'Zuordnung'
};
