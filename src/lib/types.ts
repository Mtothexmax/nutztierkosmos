export type ID = string;

/* ------------------------------------------------------------------ */
/* Mehrsprachigkeit                                                    */
/* ------------------------------------------------------------------ */

export type Locale = 'de' | 'en';

/** Sprachabhängig gepflegter Text. Deutsch ist Pflicht, Englisch optional. */
export type L10n = { de: string; en?: string };

/* ------------------------------------------------------------------ */
/* Inhaltsstruktur (LB 5.1): Kategorie → Themenschwerpunkt → Ausstellung */
/* ------------------------------------------------------------------ */

export type Status = 'draft' | 'review' | 'published' | 'archived';

/** Ebene 1 – Themenkategorie, z. B. Rind, Schwein, Geflügel. */
export type Category = {
	id: ID;
	slug: string;
	title: L10n;
	description: L10n;
	icon: string;
	color: ModuleColor;
	imageId?: ID;
	order: number;
	active: boolean;
};

/** Ebene 2 – Themenschwerpunkt, z. B. „Hitzestress bei Rindern“. */
export type Topic = {
	id: ID;
	categoryId: ID;
	slug: string;
	title: L10n;
	description: L10n;
	/** Themengebiet für Filter (z. B. Tierwohl, Klima, Ernährung). */
	fieldId: ID;
	order: number;
	active: boolean;
};

/** Themengebiet als Querschnittsfilter neben der Tierart (LB 5.2). */
export type Field = { id: ID; title: L10n; order: number };

/** Inhaltsbausteine einer Ausstellung. */
export type Block =
	| { id: ID; type: 'text'; heading?: L10n; body: L10n }
	| { id: ID; type: 'facts'; heading?: L10n; items: L10n[] }
	| { id: ID; type: 'media'; mediaId: ID }
	| { id: ID; type: 'gallery'; heading?: L10n; mediaIds: ID[] }
	| { id: ID; type: 'infographic'; infographicId: ID }
	| { id: ID; type: 'quiz'; quizId: ID }
	| { id: ID; type: 'game'; gameId: ID };

export type BlockType = Block['type'];

export type Audience = 'allgemein' | 'schule' | 'studium' | 'presse';

/** Ebene 3 – Ausstellung auf Basis einer oder mehrerer FBN-Publikationen. */
export type Exhibition = {
	id: ID;
	slug: string;
	topicId: ID;
	title: L10n;
	teaser: L10n;
	heroMediaId?: ID;
	blocks: Block[];
	publicationIds: ID[];
	keywordIds: ID[];
	audiences: Audience[];
	readingMinutes: number;
	status: Status;
	authorId: ID;
	/** Freigabe-Kommentar aus der Fachprüfung. */
	reviewNote?: string;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	versions: ExhibitionVersion[];
};

export type ExhibitionSnapshot = Omit<Exhibition, 'versions'>;

export type ExhibitionVersion = {
	id: ID;
	at: string;
	by: ID;
	note: string;
	snapshot: ExhibitionSnapshot;
};

/** Publikation als fachliche Grundlage einer Ausstellung (LB 5.1). */
export type Publication = {
	id: ID;
	title: string;
	authors: string[];
	date: string;
	summary: L10n;
	keywordIds: ID[];
	citation: string;
	url?: string;
	mediaIds: ID[];
	createdAt: string;
	updatedAt: string;
};

/** Redaktionell gepflegter Schlagwortkatalog (LB 5.2). */
export type Keyword = { id: ID; label: L10n };

/* ------------------------------------------------------------------ */
/* Medien (LB 5.3)                                                     */
/* ------------------------------------------------------------------ */

export type MediaType = 'image' | 'video' | 'audio' | 'pdf';

export type MediaItem = {
	id: ID;
	type: MediaType;
	title: L10n;
	/** Alternativtext (Pflicht bei Bildern). */
	alt: L10n;
	caption?: L10n;
	credit?: string;
	src: string;
	mime: string;
	sizeKb: number;
	width?: number;
	height?: number;
	/** Vorschaubild für Videos. */
	poster?: string;
	/** Untertitel als WebVTT je Sprache (Videos). */
	captions?: { de?: string; en?: string };
	/** Textalternative für Audio und Video. */
	transcript?: L10n;
	/** Download freigegeben (wirksam bei restriktiver Downloadbereitstellung). */
	downloadable: boolean;
	createdAt: string;
	updatedAt: string;
};

/* ------------------------------------------------------------------ */
/* Interaktive Infografiken                                            */
/* ------------------------------------------------------------------ */

export type InfographicKind = 'bars' | 'hotspots' | 'thi';

export type Infographic = {
	id: ID;
	kind: InfographicKind;
	title: L10n;
	description: L10n;
	unit?: L10n;
	bars?: { id: ID; label: L10n; value: number; note: L10n }[];
	imageId?: ID;
	hotspots?: { id: ID; x: number; y: number; title: L10n; text: L10n }[];
	source?: string;
	createdAt: string;
	updatedAt: string;
};

/* ------------------------------------------------------------------ */
/* Redaktion: Rollen, Benutzer, Protokoll (LB 6, 9.2)                   */
/* ------------------------------------------------------------------ */

export type Role = 'admin' | 'editor' | 'reviewer' | 'analyst';

export type EditorUser = {
	id: ID;
	name: string;
	email: string;
	role: Role;
	active: boolean;
	lastLoginAt?: string;
};

export type AuditEntry = {
	id: ID;
	at: string;
	userId: ID;
	action: string;
	target?: string;
	level: 'info' | 'security';
};

/* ------------------------------------------------------------------ */
/* Statistik (LB 10) – nur aggregierte Zähler, keine Personendaten      */
/* ------------------------------------------------------------------ */

export type StatsConfig = {
	pageviews: boolean;
	topics: boolean;
	interactions: boolean;
	successRates: boolean;
	searchTerms: boolean;
	dwellTime: boolean;
	retentionDays: number;
};

export type StatsData = {
	daily: Record<string, number>;
	exhibitions: Record<ID, number>;
	categories: Record<ID, number>;
	quizStarts: Record<ID, number>;
	quizCompletions: Record<ID, number>;
	quizScore: Record<ID, { sum: number; n: number }>;
	searches: Record<string, number>;
	dwell: Record<ID, { sum: number; n: number }>;
};


export type ModuleColor = 'forest' | 'amber' | 'sky' | 'berry';

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

/** Medienarten, die ein Bilderrätsel als Grundlage nutzen kann. */
export type MediaKind = 'image' | 'video' | 'infographic' | 'audio';

/** Eine Datei als Data-URL; wird direkt im Quiz gespeichert. */
export type MediaAsset = {
	id: ID;
	name: string;
	mime: string;
	src: string;
};

/**
 * Texte in Quizzen sind zweisprachig gepflegt (`L10n`). Für die Anzeige werden sie in eine
 * Sprache aufgelöst – dann ist `S` ein einfacher `string` (siehe `$lib/activities`).
 */
type QuestionBase<S = L10n> = {
	id: ID;
	prompt: S;
	explanation?: S;
	points: number;
	image?: string;
};

export type ChoiceOption<S = L10n> = { id: ID; text: S; correct: boolean };

export type McQuestion<S = L10n> = QuestionBase<S> & {
	type: 'mc';
	options: ChoiceOption<S>[];
	multiple: boolean;
};

export type TfQuestion<S = L10n> = QuestionBase<S> & {
	type: 'tf';
	correct: boolean;
};

export type ImageQuestion<S = L10n> = QuestionBase<S> & {
	type: 'image';
	mode: 'choice' | 'input' | 'click';
	options?: ChoiceOption<S>[];
	answer?: S;
	tolerance?: 'exact' | 'loose';
	clickInstruction?: S;
	clickPolygon?: { x: number; y: number }[];
	clickImageUrl?: string;
	/** Gewählte Medienart. Fehlt bei älteren Daten -> Bild. */
	mediaKind?: MediaKind;
	/** Hochgeladene Dateien. Fehlt bei älteren Daten -> `image` verwenden. */
	media?: MediaAsset[];
};

export type MatchQuestion<S = L10n> = QuestionBase<S> & {
	type: 'match';
	left: { id: ID; text: S }[];
	right: { id: ID; text: S }[];
	solution: { leftId: ID; rightId: ID }[];
	/** Mehrere Verbindungen pro Begriff erlauben; fehlt bei alten Daten -> 1:1. */
	allowMultiple?: boolean;
};

export type Question<S = L10n> = McQuestion<S> | TfQuestion<S> | ImageQuestion<S> | MatchQuestion<S>;

/**
 * Gemeinsame Grundlage für Quiz und Spiel. Beide sind gleichrangige „Mitmach-Angebote“:
 * Entscheidend ist der Themenschwerpunkt (und damit die Kategorie), nicht die Art.
 *
 * Ein Quiz oder Spiel wird nur einmal angelegt. Alle Texte sind zweisprachig (`L10n`):
 * Deutsch ist Pflicht, Englisch wird im selben Datensatz ergänzt.
 */
export type ActivityBase<S = L10n> = {
	id: ID;
	/** Themenschwerpunkt (Ebene 2); darüber ergibt sich die Kategorie (Ebene 1). */
	topicId: ID;
	title: S;
	description: S;
	published: boolean;
	createdAt: string;
	updatedAt: string;
};

export type ActivityKind = 'quiz' | 'game';

export type Quiz<S = L10n> = ActivityBase<S> & {
	questions: Question<S>[];
	timerSeconds: number | null;
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

export type Game = ActivityBase & {
	/** HTML-Spiele werden immer als Dateipaket gepflegt (ZIP-Upload). */
	kind: 'html';
	/**
	 * Sprachen, die das Spiel selbst beherrscht. Die Plattform schickt die passende Sprache
	 * im INIT (`payload.locale`); fehlt die gewählte, startet das Spiel in der ersten Sprache.
	 */
	languages: Locale[];
	files: GameFile[];
	maxPoints: number;
	apiVersion: 1;
	/** Epilepsie-Triggerwarnung vor dem Start einblenden. */
	triggerWarning: boolean;
	/**
	 * Spiel aus dem Projektordner games/ (beim Build bereitgestellt). Quelle der Wahrheit ist
	 * dann das ZIP samt game.json: Ändert sich die Version, werden Einstellungen und Dateien
	 * beim nächsten Laden übernommen.
	 */
	package?: { url: string; version: string; source: string };
};

/** Quiz oder Spiel, aufbereitet für öffentliche Listen (Mitmachen, Themenseiten). */
export type Activity = (
	| { kind: 'quiz'; item: Quiz }
	| { kind: 'game'; item: Game }
) & {
	href: string;
	/** Titel und Beschreibung in der Anzeigesprache. */
	title: string;
	description: string;
	/** Sprache, in der das Angebot tatsächlich gespielt wird. */
	lang: Locale;
};

export type Preferences = {
	/** Global vom Spieler bestätigt: Warnung nie wieder anzeigen. */
	hideTriggerWarnings: boolean;
};

export type Settings = {
	platformName: string;
	subtitle: L10n;
	pointsPerAnswer: number;
	/** Spielerische Elemente (Forscherpass, Abzeichen) öffentlich anbieten. */
	gamification: boolean;
	/** Englische Oberfläche und Inhalte anbieten. */
	englishEnabled: boolean;
	/** Restriktive Downloadbereitstellung (LB 5.3). */
	downloads: DownloadPolicy;
	/** Präsentationsmodus: Anforderungs-Hinweise einblenden. */
	presentationMode: boolean;
	contactEmail: string;
};

export type DownloadPolicy = 'all' | 'released' | 'none';

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

/** Leerer zweisprachiger Text. */
export const txt = (de = '', en = ''): L10n => ({ de, en });

export const emptyQuestion = (type: Question['type']): Question => {
	const base = { id: crypto.randomUUID(), prompt: txt(), explanation: txt(), points: 10 };
	switch (type) {
		case 'mc':
			return {
				...base,
				type: 'mc',
				multiple: false,
				options: [
					{ id: crypto.randomUUID(), text: txt(), correct: true },
					{ id: crypto.randomUUID(), text: txt(), correct: false },
					{ id: crypto.randomUUID(), text: txt(), correct: false }
				]
			};
		case 'tf':
			return { ...base, type: 'tf', correct: true };
		case 'image':
			return {
				...base,
				type: 'image',
				mode: 'choice',
				mediaKind: 'image',
				media: [],
				options: [
					{ id: crypto.randomUUID(), text: txt(), correct: true },
					{ id: crypto.randomUUID(), text: txt(), correct: false },
					{ id: crypto.randomUUID(), text: txt(), correct: false }
				]
			};
		case 'match':
			return {
				...base,
				type: 'match',
				left: [
					{ id: crypto.randomUUID(), text: txt() },
					{ id: crypto.randomUUID(), text: txt() }
				],
				right: [
					{ id: crypto.randomUUID(), text: txt() },
					{ id: crypto.randomUUID(), text: txt() }
				],
				solution: [],
				allowMultiple: false
			};
	}
};

export const questionTypeLabel: Record<Question['type'], string> = {
	mc: 'Multiple Choice',
	tf: 'Richtig/Falsch',
	image: 'Bilderrätsel',
	match: 'Zuordnung'
};

export const mediaKindLabel: Record<MediaKind, string> = {
	image: 'Bilder und Bildergalerien',
	video: 'Videos',
	infographic: 'Infografiken',
	audio: 'Audiodateien'
};

export const mediaKindHint: Record<MediaKind, string> = {
	image: 'Ein Bild oder mehrere Bilder als Galerie. PNG, JPG, GIF, WebP.',
	video: 'Ein Video, z. B. MP4 oder WebM. Im Quiz mit Player.',
	infographic: 'Eine Infografik als Bild, z. B. PNG, JPG oder WebP.',
	audio: 'Eine Audiodatei, z. B. MP3, WAV oder OGG. Im Quiz mit Player.'
};

export const mediaAccept: Record<MediaKind, string> = {
	image: 'image/*',
	video: 'video/*',
	infographic: 'image/*',
	audio: 'audio/*'
};

export const mediaIcon: Record<MediaKind, string> = {
	image: 'image',
	video: 'movie',
	infographic: 'insert_chart',
	audio: 'audio_file'
};

export const mediaMaxFiles: Record<MediaKind, number> = {
	image: 12,
	video: 1,
	infographic: 1,
	audio: 1
};

/** Nur Bild-Medien haben eine Fläche, auf der ein Polygon liegen kann. */
export const isImageMedium = (kind: MediaKind): boolean =>
	kind === 'image' || kind === 'infographic';

export const mediaSupportsPolygon = isImageMedium;

export const mediaKindOf = <S>(question: ImageQuestion<S>): MediaKind => question.mediaKind ?? 'image';

/** Einheitliche Sicht auf neue `media`-Daten und alte `image`-Fragen (inkl. Emoji-Platzhalter). */
export function mediaAssetsOf<S>(question: ImageQuestion<S>): MediaAsset[] {
	if (question.media && question.media.length > 0) return question.media;
	if (!question.image) return [];
	const isData = question.image.startsWith('data:');
	return [
		{
			id: `${question.id}-legacy`,
			name: isData ? 'Bild' : question.image,
			mime: isData ? question.image.slice(5, question.image.indexOf(';')) : 'text/plain',
			src: question.image
		}
	];
}
