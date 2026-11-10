import type {
	AuditEntry,
	Category,
	EditorUser,
	Exhibition,
	Field,
	Game,
	GameFile,
	Infographic,
	Keyword,
	MediaItem,
	Preferences,
	Publication,
	Quiz,
	Settings,
	StatsConfig,
	StatsData,
	Topic
} from '$lib/types';
import { pansenPuzzleHtml, stallklimaHtml } from '$lib/games/seed-games';

/**
 * Demo-Inhalte für den Click-Dummy.
 *
 * WICHTIG: Publikationen, Autorinnen/Autoren und Zahlenwerte sind Platzhalter
 * und keine echten FBN-Veröffentlichungen. Sie zeigen nur Struktur und Ablauf.
 */
export const SEED_VERSION = 22;

const T = (d: string, h = 9) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00.000Z`).toISOString();

const htmlFiles = (content: string): GameFile[] => [
	{
		path: 'index.html',
		kind: 'html',
		mime: 'text/html',
		encoding: 'utf8',
		content,
		size: content.length
	}
];

/* ------------------------------------------------------------------ */
/* Struktur                                                            */
/* ------------------------------------------------------------------ */

export const seedFields: Field[] = [
	{ id: 'f-tierwohl', title: { de: 'Tierwohl & Verhalten', en: 'Animal welfare & behaviour' }, order: 1 },
	{ id: 'f-klima', title: { de: 'Klima & Umwelt', en: 'Climate & environment' }, order: 2 },
	{ id: 'f-gesundheit', title: { de: 'Gesundheit & Ernährung', en: 'Health & nutrition' }, order: 3 },
	{ id: 'f-technik', title: { de: 'Digitalisierung & Technik', en: 'Digital tools & technology' }, order: 4 }
];

export const seedCategories: Category[] = [
	{
		id: 'c-rind',
		slug: 'rind',
		title: { de: 'Rind', en: 'Cattle' },
		description: {
			de: 'Milchkühe und Mastrinder: Wie sie fressen, sich fühlen und mit Hitze umgehen.',
			en: 'Dairy and beef cattle: how they eat, how they feel and how they cope with heat.'
		},
		icon: 'agriculture',
		color: 'forest',
		imageId: 'md-kat-rind',
		order: 1,
		active: true
	},
	{
		id: 'c-schwein',
		slug: 'schwein',
		title: { de: 'Schwein', en: 'Pigs' },
		description: {
			de: 'Stallklima, Beschäftigung und Verhalten: Was Schweinen guttut.',
			en: 'Barn climate, enrichment and behaviour: what is good for pigs.'
		},
		icon: 'savings',
		color: 'berry',
		imageId: 'md-kat-schwein',
		order: 2,
		active: true
	},
	{
		id: 'c-gefluegel',
		slug: 'gefluegel',
		title: { de: 'Geflügel', en: 'Poultry' },
		description: {
			de: 'Legehennen und Masthühner: Was ihr Verhalten über gute Haltung verrät.',
			en: 'Laying hens and broilers: what their behaviour tells us about good husbandry.'
		},
		icon: 'egg',
		color: 'amber',
		imageId: 'md-kat-gefluegel',
		order: 3,
		active: true
	},
	{
		id: 'c-kleinwiederkaeuer',
		slug: 'schaf-und-ziege',
		title: { de: 'Schaf & Ziege', en: 'Sheep & goats' },
		description: {
			de: 'In Vorbereitung – noch nicht öffentlich sichtbar.',
			en: 'In preparation – not yet public.'
		},
		icon: 'grass',
		color: 'sky',
		imageId: 'md-kat-wiederkaeuer',
		order: 4,
		active: false
	}
];

export const seedTopics: Topic[] = [
	{
		id: 't-hitze',
		categoryId: 'c-rind',
		slug: 'hitzestress',
		title: { de: 'Hitzestress bei Rindern', en: 'Heat stress in cattle' },
		description: {
			de: 'Warum heiße Sommer für Kühe anstrengend sind und was im Stall hilft.',
			en: 'Why hot summers are hard on cows and what helps in the barn.'
		},
		fieldId: 'f-tierwohl',
		order: 1,
		active: true
	},
	{
		id: 't-methan',
		categoryId: 'c-rind',
		slug: 'methan-und-fuetterung',
		title: { de: 'Methan und Fütterung', en: 'Methane and feeding' },
		description: {
			de: 'Wie im Pansen Methan entsteht und welche Rolle das Futter spielt.',
			en: 'How methane forms in the rumen and what role feed plays.'
		},
		fieldId: 'f-klima',
		order: 2,
		active: true
	},
	{
		id: 't-sensorik',
		categoryId: 'c-rind',
		slug: 'sensoren-im-stall',
		title: { de: 'Sensoren im Stall', en: 'Sensors in the barn' },
		description: {
			de: 'Was Halsband, Pedometer und Kamera über die Gesundheit der Tiere verraten.',
			en: 'What collars, pedometers and cameras reveal about animal health.'
		},
		fieldId: 'f-technik',
		order: 3,
		active: true
	},
	{
		id: 't-stallklima',
		categoryId: 'c-schwein',
		slug: 'stallklima',
		title: { de: 'Stallklima', en: 'Barn climate' },
		description: {
			de: 'Temperatur, Luftfeuchte und frische Luft: Wohlfühlklima für Schweine.',
			en: 'Temperature, humidity and fresh air: a comfortable climate for pigs.'
		},
		fieldId: 'f-tierwohl',
		order: 1,
		active: true
	},
	{
		id: 't-beschaeftigung',
		categoryId: 'c-schwein',
		slug: 'beschaeftigung',
		title: { de: 'Beschäftigung und Schwanzbeißen', en: 'Enrichment and tail biting' },
		description: {
			de: 'Warum Wühlen und Erkunden für Schweine so wichtig sind.',
			en: 'Why rooting and exploring matter so much to pigs.'
		},
		fieldId: 'f-tierwohl',
		order: 2,
		active: true
	},
	{
		id: 't-huehner-verhalten',
		categoryId: 'c-gefluegel',
		slug: 'verhalten-von-legehennen',
		title: { de: 'Verhalten von Legehennen', en: 'Behaviour of laying hens' },
		description: {
			de: 'Sitzstangen, Staubbaden und Rangordnung: Was Hühner brauchen.',
			en: 'Perches, dust bathing and pecking order: what hens need.'
		},
		fieldId: 'f-tierwohl',
		order: 1,
		active: true
	},
	{
		id: 't-huehner-futter',
		categoryId: 'c-gefluegel',
		slug: 'futter-und-gesundheit',
		title: { de: 'Futter und Gesundheit', en: 'Feed and health' },
		description: {
			de: 'Wie die Zusammensetzung des Futters Knochen und Eischale stärkt.',
			en: 'How feed composition strengthens bones and eggshells.'
		},
		fieldId: 'f-gesundheit',
		order: 2,
		active: true
	}
];

/* ------------------------------------------------------------------ */
/* Schlagwortkatalog                                                   */
/* ------------------------------------------------------------------ */

const kw = (id: string, de: string, en: string): Keyword => ({ id, label: { de, en } });

export const seedKeywords: Keyword[] = [
	kw('k-hitzestress', 'Hitzestress', 'heat stress'),
	kw('k-thi', 'Temperatur-Feuchte-Index', 'temperature-humidity index'),
	kw('k-milchkuh', 'Milchkuh', 'dairy cow'),
	kw('k-tierwohl', 'Tierwohl', 'animal welfare'),
	kw('k-wasser', 'Wasserversorgung', 'water supply'),
	kw('k-lueftung', 'Lüftung', 'ventilation'),
	kw('k-methan', 'Methan', 'methane'),
	kw('k-fuetterung', 'Fütterung', 'feeding'),
	kw('k-klima', 'Klimaschutz', 'climate protection'),
	kw('k-pansen', 'Pansen', 'rumen'),
	kw('k-sensorik', 'Sensorik', 'sensor technology'),
	kw('k-praezision', 'Präzisionstierhaltung', 'precision livestock farming'),
	kw('k-stallklima', 'Stallklima', 'barn climate'),
	kw('k-schwanzbeissen', 'Schwanzbeißen', 'tail biting'),
	kw('k-beschaeftigung', 'Beschäftigungsmaterial', 'enrichment material'),
	kw('k-legehenne', 'Legehenne', 'laying hen'),
	kw('k-verhalten', 'Verhalten', 'behaviour')
];

/* ------------------------------------------------------------------ */
/* Medien                                                              */
/* ------------------------------------------------------------------ */

/** KI-generierte Platzhalterfotos: Breite, Höhe, Größe in KB. */
const photoSizes: Record<string, [number, number, number]> = {
	'hitze-titel.jpg': [1536, 864, 254],
	'methan-titel.jpg': [1376, 768, 218],
	'sensoren-titel.jpg': [1240, 697, 145],
	'stallklima-titel.jpg': [1376, 768, 252],
	'beschaeftigung-titel.jpg': [1376, 768, 297],
	'huehner-titel.jpg': [1376, 768, 250],
	'kalk-titel.jpg': [1536, 864, 248],
	'hitze-ventilator.jpg': [1376, 768, 241],
	'hitze-traenke.jpg': [1376, 768, 252],
	'kat-rind.jpg': [1024, 768, 186],
	'kat-schwein.jpg': [1200, 896, 246],
	'kat-gefluegel.jpg': [1200, 896, 254],
	'kat-schaf-ziege.jpg': [1200, 896, 234]
};

const img = (
	id: string,
	file: string,
	title: [string, string],
	alt: [string, string],
	credit?: string
): MediaItem => {
	const photo = photoSizes[file];
	return {
		id,
		type: 'image',
		title: { de: title[0], en: title[1] },
		alt: { de: alt[0], en: alt[1] },
		credit: credit ?? (photo ? 'Bild: KI-generiert (Platzhalter)' : 'Illustration: Nutztierkosmos (Platzhalter)'),
		src: `/demo/${file}`,
		mime: photo ? 'image/jpeg' : 'image/svg+xml',
		sizeKb: photo ? photo[2] : 5,
		width: photo ? photo[0] : 1600,
		height: photo ? photo[1] : 900,
		downloadable: true,
		createdAt: T('2026-10-20'),
		updatedAt: T('2026-10-20')
	};
};

export const seedMedia: MediaItem[] = [
	img(
		'md-hitze',
		'hitze-titel.jpg',
		['Milchkuh im Schatten an einem heißen Tag', 'Dairy cow in the shade on a hot day'],
		[
			'Eine schwarz-weiße Milchkuh steht im Schatten eines Baumes und hechelt mit leicht geöffnetem Maul; dahinter vertrocknete Weide unter greller Sonne.',
			'A black-and-white dairy cow stands in the shade of a tree, panting with its mouth slightly open; behind it a parched pasture under a blazing sun.'
		]
	),
	img(
		'md-stall-schema',
		'stall-schema.svg',
		['Schema eines Milchviehstalls', 'Diagram of a dairy barn'],
		[
			'Schematischer Stall mit Ventilator links, Sprühdüsen an der Decke, Liegeboxen und Tränke rechts.',
			'Schematic barn with a fan on the left, sprinklers on the ceiling, cubicles and a water trough on the right.'
		]
	),
	{
		id: 'md-video-hitze',
		type: 'video',
		title: { de: 'Erklärvideo: Hitzestress in 16 Sekunden', en: 'Explainer: heat stress in 16 seconds' },
		alt: {
			de: 'Kurzes Erklärvideo mit Text-Einblendungen zum Temperatur-Feuchte-Index.',
			en: 'Short explainer video with text overlays about the temperature-humidity index.'
		},
		caption: {
			de: 'Platzhalter-Video für die Demo. Untertitel auf Deutsch und Englisch verfügbar.',
			en: 'Placeholder video for the demo. Subtitles available in German and English.'
		},
		credit: 'Video: Nutztierkosmos (Platzhalter)',
		src: '/demo/hitzestress-erklaervideo.mp4',
		poster: '/demo/hitzestress-erklaervideo-poster.jpg',
		mime: 'video/mp4',
		sizeKb: 140,
		width: 960,
		height: 540,
		captions: {
			de: '/demo/hitzestress-erklaervideo.de.vtt',
			en: '/demo/hitzestress-erklaervideo.en.vtt'
		},
		transcript: {
			de: 'Ab etwa 20 Grad Celsius beginnt für Milchkühe der Wärmestress. Entscheidend ist nicht nur die Temperatur, sondern auch die Luftfeuchte. Der Temperatur-Feuchte-Index, kurz THI, fasst beides in einer Zahl zusammen. Schatten, Luftbewegung und viel frisches Wasser helfen den Tieren.',
			en: 'From around 20 degrees Celsius, dairy cows begin to experience heat stress. What matters is not just temperature, but humidity as well. The temperature-humidity index, THI, combines both into a single number. Shade, air movement and plenty of fresh water help the animals.'
		},
		downloadable: false,
		createdAt: T('2026-10-22'),
		updatedAt: T('2026-10-22')
	},
	{
		id: 'md-audio-stall',
		type: 'audio',
		title: { de: 'Hörstück: Ein Sommertag im Stall', en: 'Audio: a summer day in the barn' },
		alt: { de: 'Audio-Atmosphäre aus einem Milchviehstall.', en: 'Audio atmosphere from a dairy barn.' },
		caption: {
			de: 'Platzhalter-Audio. Im Echtbetrieb z. B. ein Interview mit einer Wissenschaftlerin.',
			en: 'Placeholder audio. In production, e.g. an interview with a researcher.'
		},
		credit: 'Audio: Nutztierkosmos (Platzhalter)',
		src: '/demo/stall-atmosphaere.mp3',
		mime: 'audio/mpeg',
		sizeKb: 94,
		transcript: {
			de: '[Leises Rauschen von Ventilatoren, gedämpfte Stallgeräusche.] Transkript-Platzhalter: Hier stünde der vollständige Text des Interviews als barrierefreie Alternative.',
			en: '[Soft hum of fans, muffled barn sounds.] Transcript placeholder: the full text of the interview would appear here as an accessible alternative.'
		},
		downloadable: false,
		createdAt: T('2026-10-22'),
		updatedAt: T('2026-10-22')
	},
	{
		id: 'md-pdf-hitze',
		type: 'pdf',
		title: { de: 'Faktenblatt Hitzestress (PDF)', en: 'Fact sheet: heat stress (PDF, German)' },
		alt: {
			de: 'Einseitiges Faktenblatt mit THI-Formel, Anzeichen und Maßnahmen.',
			en: 'One-page fact sheet with the THI formula, signs and measures.'
		},
		credit: 'Nutztierkosmos (Platzhalter)',
		src: '/demo/faktenblatt-hitzestress.pdf',
		mime: 'application/pdf',
		sizeKb: 3,
		downloadable: true,
		createdAt: T('2026-10-23'),
		updatedAt: T('2026-10-23')
	},
	img(
		'md-methan',
		'methan-titel.jpg',
		['Wiederkäuende Kühe auf der Weide', 'Cows chewing the cud on the pasture'],
		[
			'Zwei braun-weiße Kühe liegen am frühen Morgen auf einer Wiese und käuen wieder; im Hintergrund Nebel über hügeliger Landschaft.',
			'Two brown-and-white cows lie on a meadow in the early morning chewing the cud; mist over rolling hills in the background.'
		]
	),
	img(
		'md-stallklima',
		'stallklima-titel.jpg',
		['Ruhende Schweine im hellen Stall', 'Pigs resting in a bright barn'],
		[
			'Vier Mastschweine liegen entspannt auf Stroh in einer hellen Bucht mit großen Fenstern und einer Lüftungsöffnung in der Wand.',
			'Four fattening pigs lie relaxed on straw in a bright pen with large windows and a ventilation opening in the wall.'
		]
	),
	img(
		'md-beschaeftigung',
		'beschaeftigung-titel.jpg',
		['Schweine beim Wühlen im Stroh', 'Pigs rooting in straw'],
		[
			'Mehrere Schweine wühlen mit dem Rüssel im Stroh; eines kaut an einem Holzklotz, der an einer Kette hängt.',
			'Several pigs root in the straw with their snouts; one chews on a wooden block hanging from a chain.'
		]
	),
	img(
		'md-gefluegel',
		'huehner-titel.jpg',
		['Hennen auf Sitzstangen', 'Hens on perches'],
		[
			'Braune Legehennen sitzen dicht nebeneinander auf erhöhten Holzstangen in einem Hühnerstall; Abendlicht fällt durch ein Gitterfenster.',
			'Brown laying hens sit close together on raised wooden perches in a henhouse; evening light falls through a mesh window.'
		]
	),
	img(
		'md-sensoren',
		'sensoren-titel.jpg',
		['Milchkuh mit Sensorhalsband', 'Dairy cow with a sensor collar'],
		[
			'Nahaufnahme einer schwarz-weißen Milchkuh im Laufstall; am grauen Halsband hängt unten ein kleines Sensorgehäuse.',
			'Close-up of a black-and-white dairy cow in a loose-housing barn; a small sensor unit hangs at the bottom of its grey collar.'
		]
	),
	img(
		'md-kat-rind',
		'kat-rind.jpg',
		['Kategorie Rind', 'Category cattle'],
		[
			'Eine schwarz-weiße Milchkuh trinkt im Stall aus einem Wassertrog; dahinter steht eine zweite Kuh.',
			'A black-and-white dairy cow drinks from a water trough in the barn; a second cow stands behind it.'
		]
	),
	img(
		'md-kat-schwein',
		'kat-schwein.jpg',
		['Kategorie Schwein', 'Category pigs'],
		[
			'Ein geflecktes Schwein steht mit zwei Ferkeln auf einer Wiese an einem Holzzaun; dahinter Herbstwald.',
			'A spotted pig stands with two piglets on a meadow by a wooden fence; autumn woods behind.'
		]
	),
	img(
		'md-kat-gefluegel',
		'kat-gefluegel.jpg',
		['Kategorie Geflügel', 'Category poultry'],
		[
			'Mehrere Hennen picken im Gras eines Auslaufs vor einem kleinen Holzhühnerstall.',
			'Several hens peck in the grass of an outdoor run in front of a small wooden henhouse.'
		]
	),
	img(
		'md-kat-wiederkaeuer',
		'kat-schaf-ziege.jpg',
		['Kategorie Schaf & Ziege', 'Category sheep & goats'],
		[
			'Ein Schaf und eine Ziege mit Hörnern stehen nebeneinander auf einer hügeligen Weide.',
			'A sheep and a horned goat stand side by side on a hilly pasture.'
		]
	),
	img(
		'md-kalk',
		'kalk-titel.jpg',
		['Henne am Futterautomaten', 'Hen at the feeder'],
		[
			'Eine braune Legehenne pickt Futter aus einem Futterautomaten; davor liegen Futterkalk und drei braune Eier im Stroh.',
			'A brown laying hen pecks feed from a feeder; in front lie feed limestone and three brown eggs in the straw.'
		]
	),
	img(
		'md-hitze-ventilator',
		'hitze-ventilator.jpg',
		['Großventilator im Milchviehstall', 'Large fan in a dairy barn'],
		[
			'Ein großer Deckenventilator dreht sich über den Liegeboxen eines hellen Milchviehstalls, darunter ruhen Kühe.',
			'A large ceiling fan turns above the cubicles of a bright dairy barn, with cows resting below.'
		]
	),
	img(
		'md-hitze-traenke',
		'hitze-traenke.jpg',
		['Kuh an der Tränke', 'Cow at the water trough'],
		[
			'Eine schwarz-weiße Kuh trinkt im Stall aus einem Edelstahltrog, in den frisches Wasser läuft; dahinter eine zweite Kuh.',
			'A black-and-white cow drinks in the barn from a stainless steel trough filled with running water; a second cow behind it.'
		]
	)
];

/* ------------------------------------------------------------------ */
/* Publikationen (Platzhalter!)                                        */
/* ------------------------------------------------------------------ */

const FBN = 'https://www.fbn-dummerstorf.de/';

export const seedPublications: Publication[] = [
	{
		id: 'pub-hitze-1',
		title: 'Wärmebelastung von Milchkühen im Laufstall: Zusammenhang zwischen THI, Atemfrequenz und Futteraufnahme',
		authors: ['A. Muster', 'B. Beispiel', 'C. Platzhalter'],
		date: '2026-03-14',
		summary: {
			de: 'Platzhalter-Publikation. Die Studie beschreibt, wie sich steigende THI-Werte auf Atemfrequenz, Liegezeit und Futteraufnahme von Milchkühen auswirken.',
			en: 'Placeholder publication. The study describes how rising THI values affect respiration rate, lying time and feed intake in dairy cows.'
		},
		keywordIds: ['k-hitzestress', 'k-thi', 'k-milchkuh', 'k-tierwohl'],
		citation: 'Muster A, Beispiel B, Platzhalter C (2026): Wärmebelastung von Milchkühen im Laufstall. Demo-Journal für Nutztierforschung 12(2): 101–118. [Platzhalter]',
		url: FBN,
		mediaIds: ['md-pdf-hitze'],
		createdAt: T('2026-10-01'),
		updatedAt: T('2026-10-01')
	},
	{
		id: 'pub-hitze-2',
		title: 'Kühlungsstrategien im Vergleich: Ventilation, Sprühkühlung und Wasserangebot',
		authors: ['D. Exempel', 'A. Muster'],
		date: '2025-09-02',
		summary: {
			de: 'Platzhalter-Publikation. Vergleich verschiedener Maßnahmen, mit denen sich Hitzestress im Stall verringern lässt.',
			en: 'Placeholder publication. Comparison of measures that can reduce heat stress in the barn.'
		},
		keywordIds: ['k-hitzestress', 'k-lueftung', 'k-wasser'],
		citation: 'Exempel D, Muster A (2025): Kühlungsstrategien im Vergleich. Demo-Berichte aus der Tierhaltung 7: 33–49. [Platzhalter]',
		url: FBN,
		mediaIds: [],
		createdAt: T('2026-10-01'),
		updatedAt: T('2026-10-01')
	},
	{
		id: 'pub-methan-1',
		title: 'Fütterungsstrategien zur Minderung der Methanbildung im Pansen',
		authors: ['E. Probe', 'F. Vorlage'],
		date: '2025-11-20',
		summary: {
			de: 'Platzhalter-Publikation. Untersucht, wie Ölsaaten und Futterzusätze die Methanbildung bei Milchkühen beeinflussen.',
			en: 'Placeholder publication. Investigates how oilseeds and feed additives affect methane formation in dairy cows.'
		},
		keywordIds: ['k-methan', 'k-fuetterung', 'k-pansen', 'k-klima'],
		citation: 'Probe E, Vorlage F (2025): Fütterungsstrategien zur Minderung der Methanbildung. Demo-Journal für Nutztierforschung 11(4): 210–228. [Platzhalter]',
		url: FBN,
		mediaIds: [],
		createdAt: T('2026-10-02'),
		updatedAt: T('2026-10-02')
	},
	{
		id: 'pub-sensor-1',
		title: 'Sensorgestützte Früherkennung von Erkrankungen bei Milchkühen',
		authors: ['G. Entwurf', 'B. Beispiel'],
		date: '2024-06-11',
		summary: {
			de: 'Platzhalter-Publikation. Bewegungs- und Wiederkaudaten werden genutzt, um Auffälligkeiten früh zu erkennen.'
		},
		keywordIds: ['k-sensorik', 'k-praezision', 'k-milchkuh'],
		citation: 'Entwurf G, Beispiel B (2024): Sensorgestützte Früherkennung. Demo-Berichte aus der Tierhaltung 6: 12–27. [Platzhalter]',
		url: FBN,
		mediaIds: [],
		createdAt: T('2026-10-02'),
		updatedAt: T('2026-10-02')
	},
	{
		id: 'pub-stall-1',
		title: 'Thermoregulation und Liegeverhalten von Mastschweinen bei unterschiedlichem Stallklima',
		authors: ['H. Muster', 'C. Platzhalter'],
		date: '2026-01-28',
		summary: {
			de: 'Platzhalter-Publikation. Beschreibt, wie Schweine ihr Liegeverhalten an Temperatur und Luftfeuchte anpassen.',
			en: 'Placeholder publication. Describes how pigs adapt their lying behaviour to temperature and humidity.'
		},
		keywordIds: ['k-stallklima', 'k-tierwohl', 'k-verhalten'],
		citation: 'Muster H, Platzhalter C (2026): Thermoregulation und Liegeverhalten von Mastschweinen. Demo-Journal für Nutztierforschung 12(1): 15–31. [Platzhalter]',
		url: FBN,
		mediaIds: [],
		createdAt: T('2026-10-03'),
		updatedAt: T('2026-10-03')
	},
	{
		id: 'pub-besch-1',
		title: 'Organisches Beschäftigungsmaterial und das Auftreten von Schwanzbeißen',
		authors: ['I. Beispiel', 'D. Exempel'],
		date: '2026-05-05',
		summary: {
			de: 'Platzhalter-Publikation. Vergleich verschiedener Beschäftigungsmaterialien in der Schweinehaltung.'
		},
		keywordIds: ['k-schwanzbeissen', 'k-beschaeftigung', 'k-tierwohl'],
		citation: 'Beispiel I, Exempel D (2026): Organisches Beschäftigungsmaterial und Schwanzbeißen. Demo-Berichte aus der Tierhaltung 8: 3–19. [Platzhalter]',
		url: FBN,
		mediaIds: [],
		createdAt: T('2026-10-03'),
		updatedAt: T('2026-10-03')
	},
	{
		id: 'pub-huhn-1',
		title: 'Nutzung erhöhter Sitzstangen durch Legehennen im Tagesverlauf',
		authors: ['J. Vorlage', 'E. Probe'],
		date: '2025-04-17',
		summary: {
			de: 'Platzhalter-Publikation. Wann und wie intensiv Hennen erhöhte Ebenen nutzen.',
			en: 'Placeholder publication. When and how intensively hens use elevated tiers.'
		},
		keywordIds: ['k-legehenne', 'k-verhalten', 'k-tierwohl'],
		citation: 'Vorlage J, Probe E (2025): Nutzung erhöhter Sitzstangen durch Legehennen. Demo-Journal für Nutztierforschung 11(1): 44–59. [Platzhalter]',
		url: FBN,
		mediaIds: [],
		createdAt: T('2026-10-04'),
		updatedAt: T('2026-10-04')
	}
];

/* ------------------------------------------------------------------ */
/* Interaktive Infografiken                                            */
/* ------------------------------------------------------------------ */

export const seedInfographics: Infographic[] = [
	{
		id: 'ig-thi',
		kind: 'thi',
		title: { de: 'THI-Rechner: Wie heiß ist es für die Kuh?', en: 'THI calculator: how hot is it for the cow?' },
		description: {
			de: 'Stelle Temperatur und Luftfeuchte ein. Der Rechner zeigt den Temperatur-Feuchte-Index und die Belastungsstufe.',
			en: 'Set temperature and humidity. The calculator shows the temperature-humidity index and the stress level.'
		},
		source: 'Formel nach NRC (1971); Schwellenwerte vereinfacht für die Demo.',
		createdAt: T('2026-10-24'),
		updatedAt: T('2026-10-24')
	},
	{
		id: 'ig-massnahmen',
		kind: 'hotspots',
		title: { de: 'Was im Stall gegen Hitze hilft', en: 'What helps against heat in the barn' },
		description: {
			de: 'Wähle die Punkte im Stall aus, um mehr über die einzelnen Maßnahmen zu erfahren.',
			en: 'Select the points in the barn to learn more about each measure.'
		},
		imageId: 'md-stall-schema',
		hotspots: [
			{
				id: 'h1',
				x: 0.17,
				y: 0.32,
				title: { de: 'Ventilator', en: 'Fan' },
				text: {
					de: 'Luftbewegung im Tierbereich führt Wärme vom Körper ab. Wichtig ist, dass die Luft dort ankommt, wo die Tiere liegen und fressen.',
					en: 'Air movement in the animal area carries heat away from the body. The air must reach the places where the animals lie and feed.'
				}
			},
			{
				id: 'h2',
				x: 0.48,
				y: 0.22,
				title: { de: 'Sprühkühlung', en: 'Sprinklers' },
				text: {
					de: 'Wasser auf dem Fell verdunstet und kühlt. Zusammen mit einem Ventilator wirkt Sprühkühlung besonders gut.',
					en: 'Water on the coat evaporates and cools. Sprinklers work best in combination with fans.'
				}
			},
			{
				id: 'h3',
				x: 0.83,
				y: 0.55,
				title: { de: 'Tränke', en: 'Water trough' },
				text: {
					de: 'An heißen Tagen trinkt eine Milchkuh deutlich mehr als sonst. Genug Tränkeplätze und sauberes Wasser sind entscheidend.',
					en: 'On hot days a dairy cow drinks considerably more than usual. Enough drinking places and clean water are essential.'
				}
			},
			{
				id: 'h4',
				x: 0.33,
				y: 0.58,
				title: { de: 'Liegebereich', en: 'Lying area' },
				text: {
					de: 'Gestresste Kühe stehen mehr und liegen weniger. Ein kühler, trockener Liegebereich hilft ihnen, sich zu erholen.',
					en: 'Stressed cows stand more and lie down less. A cool, dry lying area helps them recover.'
				}
			}
		],
		createdAt: T('2026-10-24'),
		updatedAt: T('2026-10-24')
	},
	{
		id: 'ig-methan',
		kind: 'bars',
		title: { de: 'Woher die Emissionen einer Milchkuh stammen', en: 'Where a dairy cow’s emissions come from' },
		description: {
			de: 'Beispielhafte Aufteilung (Demo-Werte). Wähle einen Balken für die Erklärung.',
			en: 'Example breakdown (demo values). Select a bar for the explanation.'
		},
		unit: { de: '% (Demo-Werte)', en: '% (demo values)' },
		bars: [
			{
				id: 'b1',
				label: { de: 'Verdauung (Pansen)', en: 'Digestion (rumen)' },
				value: 55,
				note: {
					de: 'Der größte Teil entsteht beim Abbau von Pflanzenfasern durch Mikroorganismen im Pansen.',
					en: 'Most of it is produced when microorganisms in the rumen break down plant fibre.'
				}
			},
			{
				id: 'b2',
				label: { de: 'Wirtschaftsdünger', en: 'Manure' },
				value: 20,
				note: {
					de: 'Auch bei Lagerung von Gülle und Mist entstehen Methan und Lachgas.',
					en: 'Storing slurry and manure also releases methane and nitrous oxide.'
				}
			},
			{
				id: 'b3',
				label: { de: 'Futtererzeugung', en: 'Feed production' },
				value: 18,
				note: {
					de: 'Anbau, Düngung und Transport des Futters tragen ebenfalls bei.',
					en: 'Growing, fertilising and transporting feed also contribute.'
				}
			},
			{
				id: 'b4',
				label: { de: 'Energie & Sonstiges', en: 'Energy & other' },
				value: 7,
				note: {
					de: 'Strom für Melktechnik und Kühlung sowie weitere Posten.',
					en: 'Electricity for milking and cooling, plus other items.'
				}
			}
		],
		source: 'Demo-Werte zur Veranschaulichung, keine Messdaten.',
		createdAt: T('2026-10-25'),
		updatedAt: T('2026-10-25')
	}
];

/* ------------------------------------------------------------------ */
/* Ausstellungen                                                       */
/* ------------------------------------------------------------------ */

type ExhibitionSeed = Omit<Exhibition, 'versions' | 'createdAt' | 'updatedAt'> & {
	createdAt?: string;
	updatedAt?: string;
};

const ex = (e: ExhibitionSeed): Exhibition => {
	const createdAt = e.createdAt ?? T('2026-10-15');
	const updatedAt = e.updatedAt ?? T('2026-11-05');
	const base = { ...e, createdAt, updatedAt };
	return {
		...base,
		versions: [
			{
				id: `${e.id}-v1`,
				at: createdAt,
				by: e.authorId,
				note: 'Erstfassung angelegt',
				snapshot: structuredClone({ ...base, status: 'draft' as const })
			},
			...(e.status === 'published'
				? [
						{
							id: `${e.id}-v2`,
							at: e.publishedAt ?? updatedAt,
							by: 'u-review',
							note: 'Fachlich geprüft und veröffentlicht',
							snapshot: structuredClone(base)
						}
					]
				: [])
		]
	};
};

export const seedExhibitions: Exhibition[] = [
	ex({
		id: 'e-hitzestress',
		slug: 'wenn-es-der-kuh-zu-heiss-wird',
		topicId: 't-hitze',
		title: { de: 'Wenn es der Kuh zu heiß wird', en: 'When it gets too hot for the cow' },
		teaser: {
			de: 'Schon ab rund 20 °C kann eine Milchkuh unter Hitzestress leiden. Warum das so ist, woran man es erkennt und was im Stall hilft.',
			en: 'A dairy cow can suffer from heat stress at temperatures as low as around 20 °C. Why that is, how to recognise it and what helps in the barn.'
		},
		heroMediaId: 'md-hitze',
		readingMinutes: 6,
		audiences: ['allgemein', 'schule', 'presse'],
		publicationIds: ['pub-hitze-1', 'pub-hitze-2'],
		keywordIds: ['k-hitzestress', 'k-thi', 'k-milchkuh', 'k-tierwohl', 'k-wasser', 'k-lueftung'],
		status: 'published',
		authorId: 'u-editor',
		publishedAt: T('2026-11-03'),
		createdAt: T('2026-10-20'),
		updatedAt: T('2026-11-03'),
		blocks: [
			{
				id: 'b-h-facts',
				type: 'facts',
				heading: { de: 'Das Wichtigste in Kürze', en: 'Key points' },
				items: [
					{
						de: 'Milchkühe fühlen sich bei kühlen Temperaturen am wohlsten – Hitze belastet sie viel früher als uns Menschen.',
						en: 'Dairy cows are most comfortable at cool temperatures – heat affects them much sooner than it affects humans.'
					},
					{
						de: 'Neben der Temperatur zählt die Luftfeuchte. Der Temperatur-Feuchte-Index (THI) fasst beides zusammen.',
						en: 'Humidity matters as well as temperature. The temperature-humidity index (THI) combines both.'
					},
					{
						de: 'Schatten, Luftbewegung, Sprühkühlung und viel frisches Wasser verringern den Stress deutlich.',
						en: 'Shade, air movement, sprinklers and plenty of fresh water reduce stress considerably.'
					}
				]
			},
			{
				id: 'b-h-intro',
				type: 'text',
				heading: { de: 'Warum Kühe Hitze schlecht vertragen', en: 'Why cows cope poorly with heat' },
				body: {
					de: 'Eine Milchkuh ist ein kleines Kraftwerk: Bei der Verdauung im Pansen und bei der Milchbildung entsteht viel Wärme. Diese Wärme muss der Körper wieder abgeben – über die Haut, die Atmung und durch Schwitzen, das bei Rindern aber nur schwach ausgeprägt ist.\n\nIst die Umgebung warm und feucht, gelingt das immer schlechter. Die Körpertemperatur steigt, die Tiere atmen schneller und fressen weniger. Das kostet Kraft und kann auf Dauer die Gesundheit beeinträchtigen.',
					en: 'A dairy cow is a small power plant: digestion in the rumen and milk production generate a lot of heat. The body has to release this heat again – through the skin, breathing and sweating, which is only weakly developed in cattle.\n\nIf the environment is warm and humid, this becomes increasingly difficult. Body temperature rises, the animals breathe faster and eat less. This saps their strength and can harm their health in the long run.'
				}
			},
			{ id: 'b-h-thi', type: 'infographic', infographicId: 'ig-thi' },
			{ id: 'b-h-video', type: 'media', mediaId: 'md-video-hitze' },
			{
				id: 'b-h-signs',
				type: 'text',
				heading: { de: 'Woran man Hitzestress erkennt', en: 'How to recognise heat stress' },
				body: {
					de: 'Die Atemfrequenz ist ein guter Frühindikator: Eine entspannte Kuh atmet etwa 20- bis 40-mal pro Minute, unter Hitzestress deutlich häufiger. Weitere Anzeichen sind vermehrtes Stehen statt Liegen, Speicheln, Hecheln mit geöffnetem Maul und eine geringere Futteraufnahme. Häufig sinkt auch die Milchleistung.',
					en: 'Respiration rate is a good early indicator: a relaxed cow breathes about 20 to 40 times a minute, considerably more under heat stress. Other signs are standing rather than lying, drooling, panting with the mouth open and reduced feed intake. Milk yield often drops as well.'
				}
			},
			{ id: 'b-h-hotspots', type: 'infographic', infographicId: 'ig-massnahmen' },
			{
				id: 'b-h-gallery',
				type: 'gallery',
				heading: { de: 'Bildergalerie', en: 'Image gallery' },
				mediaIds: ['md-hitze', 'md-hitze-ventilator', 'md-hitze-traenke']
			},
			{ id: 'b-h-audio', type: 'media', mediaId: 'md-audio-stall' },
			{ id: 'b-h-pdf', type: 'media', mediaId: 'md-pdf-hitze' },
			{ id: 'b-h-quiz', type: 'quiz', quizId: 'q-hitze' },
			// Spiel aus games/ (Nutztierkosmos-Spiel.zip), wird beim Build bereitgestellt.
			{ id: 'b-h-game', type: 'game', gameId: 'g-heisser-tag' }
		]
	}),
	ex({
		id: 'e-methan',
		slug: 'methan-aus-dem-pansen',
		topicId: 't-methan',
		title: { de: 'Methan aus dem Pansen', en: 'Methane from the rumen' },
		teaser: {
			de: 'Kühe stoßen Methan aus – aber warum eigentlich? Und kann das richtige Futter helfen, die Emissionen zu senken?',
			en: 'Cows emit methane – but why? And can the right feed help reduce emissions?'
		},
		heroMediaId: 'md-methan',
		readingMinutes: 5,
		audiences: ['allgemein', 'schule', 'studium'],
		publicationIds: ['pub-methan-1'],
		keywordIds: ['k-methan', 'k-fuetterung', 'k-pansen', 'k-klima', 'k-milchkuh'],
		status: 'published',
		authorId: 'u-editor',
		publishedAt: T('2026-10-28'),
		createdAt: T('2026-10-18'),
		updatedAt: T('2026-10-28'),
		blocks: [
			{
				id: 'b-m-text',
				type: 'text',
				heading: { de: 'Ein Magen voller Mikroben', en: 'A stomach full of microbes' },
				body: {
					de: 'Rinder sind Wiederkäuer. In ihrem Pansen leben Milliarden Mikroorganismen, die Gras und Heu zerlegen – Pflanzenfasern, die wir Menschen nicht verdauen können. Dabei entsteht Wasserstoff, den bestimmte Mikroben, die Archaeen, zu Methan umbauen. Die Kuh gibt das Gas vor allem über das Maul ab.',
					en: 'Cattle are ruminants. Billions of microorganisms live in their rumen and break down grass and hay – plant fibre that humans cannot digest. This produces hydrogen, which certain microbes, the archaea, convert into methane. The cow releases the gas mainly through its mouth.'
				}
			},
			{ id: 'b-m-bars', type: 'infographic', infographicId: 'ig-methan' },
			{
				id: 'b-m-feed',
				type: 'text',
				heading: { de: 'Welche Rolle das Futter spielt' },
				body: {
					de: 'Die Zusammensetzung der Ration beeinflusst, wie viel Methan entsteht. Fettreiche Ölsaaten wie Raps oder Lein können die Methanbildner hemmen. Auch Futterzusätze werden erforscht. Wichtig ist dabei immer, dass die Kuh gesund bleibt und ihr Futter gut verwerten kann.'
				}
			},
			{ id: 'b-m-quiz', type: 'quiz', quizId: 'q-methan' },
			{ id: 'b-m-game', type: 'game', gameId: 'g-pansen' }
		]
	}),
	ex({
		id: 'e-sensoren',
		slug: 'was-sensoren-ueber-kuehe-verraten',
		topicId: 't-sensorik',
		title: { de: 'Was Sensoren über Kühe verraten' },
		teaser: {
			de: 'Halsbänder und Pedometer messen Bewegung und Wiederkauen rund um die Uhr. So lassen sich Erkrankungen früher erkennen.'
		},
		heroMediaId: 'md-sensoren',
		readingMinutes: 4,
		audiences: ['allgemein', 'studium'],
		publicationIds: ['pub-sensor-1'],
		keywordIds: ['k-sensorik', 'k-praezision', 'k-milchkuh'],
		status: 'published',
		authorId: 'u-editor',
		publishedAt: T('2026-09-30'),
		createdAt: T('2026-09-20'),
		updatedAt: T('2026-09-30'),
		blocks: [
			{
				id: 'b-s-text',
				type: 'text',
				body: {
					de: 'Moderne Ställe sind voller Messtechnik. Ein Sensor am Halsband erkennt, wie lange eine Kuh wiederkaut. Wiederkaut sie plötzlich weniger, kann das ein frühes Zeichen für eine Erkrankung sein – oft schon, bevor man es dem Tier ansieht. Die Daten ersetzen aber nicht den Blick der Tierhalterin oder des Tierhalters, sondern ergänzen ihn.'
				}
			},
			{
				id: 'b-s-facts',
				type: 'facts',
				heading: { de: 'Was gemessen wird' },
				items: [{ de: 'Aktivität und Schrittzahl' }, { de: 'Wiederkauzeit' }, { de: 'Liege- und Fresszeiten' }]
			},
			{ id: 'b-s-quiz', type: 'quiz', quizId: 'q-sensorik' }
		]
	}),
	ex({
		id: 'e-stallklima',
		slug: 'wohlfuehlklima-im-schweinestall',
		topicId: 't-stallklima',
		title: { de: 'Wohlfühlklima im Schweinestall', en: 'A comfortable climate in the pig barn' },
		teaser: {
			de: 'Schweine können kaum schwitzen. Wie warm, feucht und frisch die Luft im Stall ist, entscheidet daher stark über ihr Wohlbefinden.',
			en: 'Pigs can hardly sweat. How warm, humid and fresh the air in the barn is therefore has a strong effect on their well-being.'
		},
		heroMediaId: 'md-stallklima',
		readingMinutes: 4,
		audiences: ['allgemein', 'schule'],
		publicationIds: ['pub-stall-1'],
		keywordIds: ['k-stallklima', 'k-tierwohl', 'k-lueftung', 'k-verhalten'],
		status: 'published',
		authorId: 'u-editor',
		publishedAt: T('2026-10-12'),
		createdAt: T('2026-10-05'),
		updatedAt: T('2026-10-12'),
		blocks: [
			{
				id: 'b-st-text',
				type: 'text',
				heading: { de: 'Schweine zeigen, wie es ihnen geht', en: 'Pigs show how they feel' },
				body: {
					de: 'Wie Schweine liegen, verrät viel über das Stallklima: Ist es ihnen zu kalt, liegen sie eng aneinander. Ist es zu warm, liegen sie ausgestreckt und mit Abstand – und suchen kühle, feuchte Stellen. Eine gute Lüftung sorgt für frische Luft, ohne dass es zieht.',
					en: 'The way pigs lie tells you a lot about the barn climate: if they are too cold, they huddle together. If it is too warm, they lie stretched out and apart – and look for cool, damp spots. Good ventilation provides fresh air without draughts.'
				}
			},
			{ id: 'b-st-quiz', type: 'quiz', quizId: 'q-stallklima' },
			{ id: 'b-st-game', type: 'game', gameId: 'g-stallklima' },
			{ id: 'b-st-verhalten', type: 'quiz', quizId: 'q-schwein-verhalten' }
		]
	}),
	ex({
		id: 'e-beschaeftigung',
		slug: 'warum-schweine-wuehlen-muessen',
		topicId: 't-beschaeftigung',
		title: { de: 'Warum Schweine wühlen müssen' },
		teaser: {
			de: 'Schweine sind neugierig und wollen erkunden. Fehlt passendes Material, kann es zu Schwanzbeißen kommen.'
		},
		heroMediaId: 'md-beschaeftigung',
		readingMinutes: 4,
		audiences: ['allgemein'],
		publicationIds: ['pub-besch-1'],
		keywordIds: ['k-schwanzbeissen', 'k-beschaeftigung', 'k-tierwohl'],
		status: 'review',
		authorId: 'u-editor',
		createdAt: T('2026-11-04'),
		updatedAt: T('2026-11-08'),
		blocks: [
			{
				id: 'b-b-text',
				type: 'text',
				body: {
					de: 'Wühlen, Kauen und Erkunden gehören zum natürlichen Verhalten von Schweinen. Stroh, Heu oder Holz bieten dafür Gelegenheit. Entwurf – wartet auf fachliche Prüfung.'
				}
			},
			{ id: 'b-b-quiz', type: 'quiz', quizId: 'q-schwein-verhalten' }
		]
	}),
	ex({
		id: 'e-huehner',
		slug: 'warum-huehner-hoch-hinaus-wollen',
		topicId: 't-huehner-verhalten',
		title: { de: 'Warum Hühner hoch hinaus wollen', en: 'Why hens like to perch up high' },
		teaser: {
			de: 'Zum Schlafen fliegen Hennen gern auf erhöhte Sitzstangen. Das hat mit ihren wilden Vorfahren zu tun.',
			en: 'Hens like to fly up onto raised perches to sleep. It has to do with their wild ancestors.'
		},
		heroMediaId: 'md-gefluegel',
		readingMinutes: 3,
		audiences: ['allgemein', 'schule'],
		publicationIds: ['pub-huhn-1'],
		keywordIds: ['k-legehenne', 'k-verhalten', 'k-tierwohl'],
		status: 'published',
		authorId: 'u-editor',
		publishedAt: T('2026-08-21'),
		createdAt: T('2026-08-10'),
		updatedAt: T('2026-08-21'),
		blocks: [
			{
				id: 'b-hu-text',
				type: 'text',
				body: {
					de: 'Das Bankivahuhn, die Wildform unseres Haushuhns, schläft in Bäumen – sicher vor Fressfeinden. Diesen Drang haben auch unsere Legehennen behalten. Erhöhte Sitzstangen geben ihnen Sicherheit und Ruhe. Für die Haltung heißt das: genug Sitzplätze in verschiedenen Höhen und gut erreichbare Ebenen.',
					en: 'The red junglefowl, the wild ancestor of our domestic chicken, sleeps in trees – safe from predators. Our laying hens have kept this urge. Raised perches give them security and rest. For husbandry, this means enough perches at different heights and easily accessible tiers.'
				}
			},
			{ id: 'b-hu-quiz', type: 'quiz', quizId: 'q-huhn-zuordnen' }
		]
	}),
	ex({
		id: 'e-huhn-futter',
		slug: 'kalk-fuer-starke-schalen',
		topicId: 't-huehner-futter',
		title: { de: 'Kalk für starke Schalen' },
		teaser: { de: 'Entwurf: Wie Calcium im Futter Knochen und Eischale stärkt.' },
		heroMediaId: 'md-kalk',
		readingMinutes: 3,
		audiences: ['allgemein'],
		publicationIds: [],
		keywordIds: ['k-legehenne', 'k-fuetterung'],
		status: 'draft',
		authorId: 'u-editor',
		createdAt: T('2026-11-07'),
		updatedAt: T('2026-11-09'),
		blocks: [{ id: 'b-hf-text', type: 'text', body: { de: 'Hier entsteht eine neue Ausstellung.' } }]
	})
];

/* ------------------------------------------------------------------ */
/* Quiz und Spiele                                                     */
/* ------------------------------------------------------------------ */

const baseQuizzes: Quiz[] = [
	{
		id: 'q-methan',
		topicId: 't-methan',
		title: 'Was weißt du über Methan?',
		description: 'Sechs Fragen zu Pansen, Futter und Emissionen.',
		published: true,
		timerSeconds: null,
		createdAt: T('2026-10-26'),
		updatedAt: T('2026-11-06'),
		questions: [
			{
				id: 'q1',
				type: 'mc',
				prompt: 'Wodurch entsteht im Pansen der Kühe vor allem Methan?',
				explanation:
					'Methan entsteht, wenn Archaeen im Pansen Kohlenstoff und Wasserstoff zusammenbauen – vor allem bei faserreichem Futter.',
				points: 10,
				multiple: false,
				options: [
					{ id: 'q1a', text: 'Durch Mikroorganismen beim Abbau von Fasern', correct: true },
					{ id: 'q1b', text: 'Durch die Atmung der Kuh', correct: false },
					{ id: 'q1c', text: 'Durch das Wasser im Tränkebecken', correct: false }
				]
			},
			{
				id: 'q2',
				type: 'tf',
				prompt:
					'Eine Milchkuh produziert pro Tag mehr Treibhausgas als ein Kleinwagen auf 100 km.',
				explanation:
					'Die Aussage ist stark vereinfacht: Pro Kilogramm Milch ist die Bilanz heute deutlich besser als ihr Ruf – Vergleiche hängen von Bezugsgröße und Futter ab.',
				points: 10,
				correct: false
			},
			{
				id: 'q3',
				type: 'image',
				prompt: 'Welches Futter kann die Methanbildung im Pansen reduzieren?',
				explanation:
					'Ungesättigte Fettsäuren aus Ölsaaten hemmen die Methanbildner im Pansen.',
				points: 10,
				mode: 'choice',
				image: '',
				options: [
					{ id: 'q3a', text: 'Mais', correct: false },
					{ id: 'q3b', text: 'Heu', correct: false },
					{ id: 'q3c', text: 'Raps- und Leinsaat', correct: true }
				]
			},
			{
				id: 'q4',
				type: 'match',
				prompt: 'Ordne die Begriffe zu.',
				explanation: 'Pansen, Archaeen, Futterzusätze und Messkammern greifen ineinander.',
				points: 10,
				left: [
					{ id: 'q4l1', text: 'Pansen' },
					{ id: 'q4l2', text: 'Archaeen' },
					{ id: 'q4l3', text: 'Futterzusatz' },
					{ id: 'q4l4', text: 'Messkammer' }
				],
				right: [
					{ id: 'q4r1', text: 'Verdauungsorgan' },
					{ id: 'q4r2', text: 'Methanbildner' },
					{ id: 'q4r3', text: 'Senkt Emissionen' },
					{ id: 'q4r4', text: 'Erfasst Ausatemluft' }
				],
				solution: [
					{ leftId: 'q4l1', rightId: 'q4r1' },
					{ leftId: 'q4l2', rightId: 'q4r2' },
					{ leftId: 'q4l3', rightId: 'q4r3' },
					{ leftId: 'q4l4', rightId: 'q4r4' }
				]
			},
			{
				id: 'q5',
				type: 'mc',
				prompt: 'Welche Faktoren beeinflussen die Methanemission? (2 Antworten)',
				explanation: 'Fütterung und Leistung der Kuh wirken direkt auf die Emission pro Kilogramm Milch.',
				points: 10,
				multiple: true,
				options: [
					{ id: 'q5a', text: 'Fütterung', correct: true },
					{ id: 'q5b', text: 'Leistung der Kuh', correct: true },
					{ id: 'q5c', text: 'Farbe des Stalls', correct: false },
					{ id: 'q5d', text: 'Mondphase', correct: false }
				]
			},
			{
				id: 'q6',
				type: 'tf',
				prompt:
					'Wiederkäuer können Pflanzenfasern verwerten, die Menschen nicht verdauen können.',
				explanation: 'Dafür sorgen die Mikroorganismen im Pansen – der Grund, warum Wiederkäuer Gras nutzen können.',
				points: 10,
				correct: true
			}
		]
	},
	{
		id: 'q-stallklima',
		topicId: 't-stallklima',
		title: 'Stallklima-Check',
		description: 'Vier Fragen zu Temperatur, Luft und Verhalten.',
		published: true,
		timerSeconds: null,
		createdAt: T('2026-10-28'),
		updatedAt: T('2026-11-02'),
		questions: [
			{
				id: 's1',
				type: 'mc',
				prompt: 'Welche Temperatur ist für Mastschweine am angenehmsten?',
				explanation: 'Mastschweine fühlen sich bei etwa 20–24 °C wohl.',
				points: 10,
				multiple: false,
				options: [
					{ id: 's1a', text: '10–14 °C', correct: false },
					{ id: 's1b', text: '20–24 °C', correct: true },
					{ id: 's1c', text: '28–32 °C', correct: false }
				]
			},
			{
				id: 's2',
				type: 'tf',
				prompt: 'Zu hohe Luftfeuchte im Stall begünstigt Atemwegserkrankungen.',
				explanation: 'Feuchte Luft und Ammoniak belasten die Atemwege.',
				points: 10,
				correct: true
			},
			{
				id: 's3',
				type: 'mc',
				prompt: 'Was zeigt ein Schwein, dem zu warm ist?',
				explanation: 'Hecheln und flaches Liegen auf kühlen Flächen sind typische Zeichen.',
				points: 10,
				multiple: false,
				options: [
					{ id: 's3a', text: 'Hecheln und flaches Liegen', correct: true },
					{ id: 's3b', text: 'Aktives Wühlen', correct: false },
					{ id: 's3c', text: 'Lautes Quieken beim Fressen', correct: false }
				]
			},
			{
				id: 's4',
				type: 'tf',
				prompt: 'Frischluftzufuhr ist im Winter nicht nötig.',
				explanation: 'Auch im Winter muss gelüftet werden – sonst steigen Feuchte und Schadgase.',
				points: 10,
				correct: false
			}
		]
	},
	{
		id: 'q-schwein-verhalten',
		topicId: 't-beschaeftigung',
		title: 'Was sagt mir das Schwein?',
		description:
			'Fünf Situationen aus dem Schweinealltag: Welche Deutung ist plausibel – und was müsste man noch wissen?',
		published: true,
		timerSeconds: null,
		createdAt: T('2026-11-10'),
		updatedAt: T('2026-11-10'),
		questions: [
			{
				id: 'v1',
				type: 'image',
				prompt: 'Das Schwein hält den Rüssel dicht an einen Ast im Laub. Welche Deutung ist am plausibelsten?',
				explanation:
					'Rüssel am Boden, Ohren nach vorn, ruhige Körperhaltung: Das Schwein erkundet neugierig. Wühlen und Erkunden sind Grundbedürfnisse – fehlt passendes Material, steigt das Risiko für Stress und Schwanzbeißen.',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 'v1-img',
						name: 'Ein geflecktes Schwein schnuppert auf einer Weide an einem moosigen Ast im Herbstlaub.',
						mime: 'image/jpeg',
						src: '/demo/schwein-neugierig.jpg'
					}
				],
				options: [
					{ id: 'v1b', text: 'Es ist krank und frisst deshalb Laub.', correct: false },
					{ id: 'v1a', text: 'Es erkundet neugierig seine Umgebung.', correct: true },
					{ id: 'v1c', text: 'Es hat Angst vor dem Ast.', correct: false }
				]
			},
			{
				id: 'v2',
				type: 'image',
				prompt: 'Das Schwein drückt den Rüssel an einen Zaunpfosten. Was ist eine plausible Deutung?',
				explanation:
					'Schweine sind soziale Tiere und nehmen viel über den Rüssel wahr. Hier sucht es wahrscheinlich Kontakt. Um sicher zu sein, braucht man mehr Informationen: Ist auf der anderen Seite ein Artgenosse oder ein Mensch? Wird das Schwein allein gehalten?',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 'v2-img',
						name: 'Ein geflecktes Schwein steht an einem Holzzaun und drückt den Rüssel an einen Pfosten.',
						mime: 'image/jpeg',
						src: '/demo/schwein-sucht-kontakt.jpg'
					}
				],
				options: [
					{ id: 'v2b', text: 'Es ist aggressiv und will den Zaun zerstören.', correct: false },
					{ id: 'v2c', text: 'Es hat Durst.', correct: false },
					{ id: 'v2a', text: 'Es sucht Kontakt zu Artgenossen oder Menschen.', correct: true }
				]
			},
			{
				id: 'v3',
				type: 'image',
				prompt: 'Das Schwein lehnt sich an den Zaun, die Augen sind halb geschlossen. Was zeigt es am ehesten?',
				explanation:
					'Halb geschlossene Augen und eine angelehnte, entspannte Haltung sprechen für Müdigkeit. Ein einzelner Moment sagt aber wenig: Wirkt das Schwein über längere Zeit matt, frisst es schlecht oder liegt es oft abseits, sollte man an Hitze oder Krankheit denken.',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 'v3-img',
						name: 'Ein geflecktes Schwein lehnt mit dem Hinterteil am Holzzaun, die Augen halb geschlossen.',
						mime: 'image/jpeg',
						src: '/demo/schwein-muede.jpg'
					}
				],
				options: [
					{ id: 'v3a', text: 'Es ist müde und ruht sich aus.', correct: true },
					{ id: 'v3c', text: 'Es sucht nach Futter.', correct: false },
					{ id: 'v3b', text: 'Es ist besonders verspielt.', correct: false }
				]
			},
			{
				id: 'v4',
				type: 'image',
				prompt: 'Das Schwein drückt sich mit gesenktem Kopf und hängendem Schwanz an den Zaun. Wie lässt sich das deuten?',
				explanation:
					'Gesenkter Kopf, hängender Schwanz und ein Körper, der sich an den Zaun drückt: Das Schwein zieht sich zurück – ein mögliches Zeichen für Angst oder Stress. Ein Schwein kann äußerlich gesund aussehen und sich trotzdem nicht wohlfühlen. Wichtig ist: Was hat es erschreckt? Gibt es Rangkämpfe? Hat es genug Platz und Rückzugsorte?',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 'v4-img',
						name: 'Ein geflecktes Schwein drückt sich mit gesenktem Kopf und hängendem Schwanz an einen Holzzaun.',
						mime: 'image/jpeg',
						src: '/demo/schwein-angst.jpg'
					}
				],
				options: [
					{ id: 'v4b', text: 'Es ist entspannt und zufrieden.', correct: false },
					{ id: 'v4a', text: 'Es hat Angst oder ist gestresst und zieht sich zurück.', correct: true },
					{ id: 'v4c', text: 'Es fordert die anderen zum Spielen auf.', correct: false }
				]
			},
			{
				id: 'v5',
				type: 'image',
				prompt:
					'Warum ist Schwein Emma unruhig? Auf dem Bild läuft Emma an den Gitterstäben ihrer Bucht entlang – das macht sie immer wieder. Welche Maßnahme wäre ein sinnvoller erster Schritt?',
				explanation:
					'Wiederholtes Hin- und Herlaufen kann viele Ursachen haben: Langeweile, Hunger, Hitze, zu wenig Platz oder Stress in der Gruppe. Deshalb zuerst beobachten: Wann tritt es auf? Stimmen Futter, Wasser, Temperatur und Beschäftigung? Sofort trennen wäre zusätzlicher Stress, Ignorieren übersieht ein mögliches Tierwohlproblem.',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 'v5-img',
						name: 'Ferkel Emma läuft im Stroh an den Gitterstäben der Bucht entlang. Im Hintergrund liegen andere Ferkel, daneben ein Spielball und ein Holzstück.',
						mime: 'image/jpeg',
						src: '/demo/schwein-emma-gitter.jpg'
					}
				],
				options: [
					{ id: 'v5a', text: 'Verhalten beobachten und mögliche Umweltfaktoren untersuchen.', correct: true },
					{ id: 'v5b', text: 'Emma sofort von den anderen Tieren trennen.', correct: false },
					{ id: 'v5c', text: 'Das Verhalten grundsätzlich ignorieren.', correct: false }
				]
			}
		]
	},
	{
		id: 'q-schwein-verhalten-en',
		topicId: 't-beschaeftigung',
		lang: 'en',
		translationOf: 'q-schwein-verhalten',
		title: 'What is the pig telling me?',
		description:
			'Five situations from a pig’s everyday life: which interpretation is plausible – and what else would you need to know?',
		published: true,
		timerSeconds: null,
		createdAt: T('2026-11-10'),
		updatedAt: T('2026-11-10'),
		questions: [
			{
				id: 've1',
				type: 'image',
				prompt: 'The pig holds its snout close to a branch in the leaves. Which interpretation is most plausible?',
				explanation:
					'Snout to the ground, ears forward, calm posture: the pig is curiously exploring. Rooting and exploring are basic needs – without suitable material, the risk of stress and tail biting rises.',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 've1-img',
						name: 'A spotted pig sniffs at a mossy branch among autumn leaves in a pasture.',
						mime: 'image/jpeg',
						src: '/demo/schwein-neugierig.jpg'
					}
				],
				options: [
					{ id: 've1b', text: 'It is ill and is eating leaves because of that.', correct: false },
					{ id: 've1a', text: 'It is curiously exploring its surroundings.', correct: true },
					{ id: 've1c', text: 'It is afraid of the branch.', correct: false }
				]
			},
			{
				id: 've2',
				type: 'image',
				prompt: 'The pig presses its snout against a fence post. What is a plausible interpretation?',
				explanation:
					'Pigs are social animals and perceive a lot through their snout. This one is probably seeking contact. To be sure, you need more information: is there another pig or a person on the other side? Is the pig kept on its own?',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 've2-img',
						name: 'A spotted pig stands at a wooden fence and presses its snout against a post.',
						mime: 'image/jpeg',
						src: '/demo/schwein-sucht-kontakt.jpg'
					}
				],
				options: [
					{ id: 've2b', text: 'It is aggressive and wants to break the fence.', correct: false },
					{ id: 've2c', text: 'It is thirsty.', correct: false },
					{ id: 've2a', text: 'It is seeking contact with other pigs or people.', correct: true }
				]
			},
			{
				id: 've3',
				type: 'image',
				prompt: 'The pig leans against the fence with its eyes half closed. What is it most likely showing?',
				explanation:
					'Half-closed eyes and a relaxed, leaning posture suggest tiredness. But a single moment says little: if the pig seems listless for a longer time, eats poorly or often lies apart from the others, think of heat or illness.',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 've3-img',
						name: 'A spotted pig leans its hindquarters against a wooden fence, eyes half closed.',
						mime: 'image/jpeg',
						src: '/demo/schwein-muede.jpg'
					}
				],
				options: [
					{ id: 've3a', text: 'It is tired and resting.', correct: true },
					{ id: 've3c', text: 'It is looking for food.', correct: false },
					{ id: 've3b', text: 'It is in a particularly playful mood.', correct: false }
				]
			},
			{
				id: 've4',
				type: 'image',
				prompt: 'The pig presses itself against the fence with its head lowered and its tail hanging. How can this be interpreted?',
				explanation:
					'Lowered head, hanging tail and a body pressed against the fence: the pig is withdrawing – a possible sign of fear or stress. A pig can look healthy on the outside and still not feel well. Important questions: what frightened it? Are there fights over rank? Does it have enough space and places to retreat?',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 've4-img',
						name: 'A spotted pig presses itself against a wooden fence with its head lowered and its tail hanging.',
						mime: 'image/jpeg',
						src: '/demo/schwein-angst.jpg'
					}
				],
				options: [
					{ id: 've4b', text: 'It is relaxed and content.', correct: false },
					{ id: 've4a', text: 'It is afraid or stressed and is withdrawing.', correct: true },
					{ id: 've4c', text: 'It is inviting the others to play.', correct: false }
				]
			},
			{
				id: 've5',
				type: 'image',
				prompt:
					'Why is Emma the pig restless? In the picture, Emma is walking along the bars of her pen – and she does this again and again. What would be a sensible first step?',
				explanation:
					'Repeatedly pacing back and forth can have many causes: boredom, hunger, heat, too little space or stress within the group. So observe first: when does it happen? Are feed, water, temperature and enrichment right? Separating her straight away would add stress; ignoring it overlooks a possible animal welfare problem.',
				points: 10,
				mode: 'choice',
				mediaKind: 'image',
				media: [
					{
						id: 've5-img',
						name: 'Emma the piglet walks through straw along the bars of the pen. Other piglets lie in the background, next to a play ball and a piece of wood.',
						mime: 'image/jpeg',
						src: '/demo/schwein-emma-gitter.jpg'
					}
				],
				options: [
					{ id: 've5a', text: 'Observe the behaviour and look into possible environmental factors.', correct: true },
					{ id: 've5b', text: 'Separate Emma from the other animals immediately.', correct: false },
					{ id: 've5c', text: 'Simply ignore the behaviour.', correct: false }
				]
			}
		]
	},
	{
		id: 'q-huhn-zuordnen',
		topicId: 't-huehner-verhalten',
		title: 'Was brauchen Hühner?',
		description: 'Drei Zuordnungen zu Verhalten, Futter und Haltung von Legehennen.',
		published: true,
		timerSeconds: null,
		createdAt: T('2026-11-10'),
		updatedAt: T('2026-11-10'),
		questions: [
			{
				id: 'hz1',
				type: 'match',
				prompt: 'Was bedeutet das Verhalten? Ordne zu.',
				explanation:
					'Hennen zeigen diese Verhaltensweisen von sich aus. Fehlt die Gelegenheit dazu – etwa ein Staubbad oder ein Nest –, entsteht Stress.',
				points: 10,
				left: [
					{ id: 'hz1l1', text: 'Staubbaden' },
					{ id: 'hz1l2', text: 'Auf Sitzstangen ruhen' },
					{ id: 'hz1l3', text: 'Scharren und Picken' },
					{ id: 'hz1l4', text: 'Ein Nest aufsuchen' }
				],
				right: [
					{ id: 'hz1r3', text: 'Sucht nach Futter' },
					{ id: 'hz1r1', text: 'Pflegt das Gefieder, hält Parasiten fern' },
					{ id: 'hz1r4', text: 'Bereitet die Eiablage vor' },
					{ id: 'hz1r2', text: 'Fühlt sich erhöht nachts sicher' }
				],
				solution: [
					{ leftId: 'hz1l1', rightId: 'hz1r1' },
					{ leftId: 'hz1l2', rightId: 'hz1r2' },
					{ leftId: 'hz1l3', rightId: 'hz1r3' },
					{ leftId: 'hz1l4', rightId: 'hz1r4' }
				]
			},
			{
				id: 'hz2',
				type: 'match',
				prompt: 'Wofür braucht die Henne das? Ordne zu.',
				explanation:
					'Für jedes Ei braucht die Henne viel Calcium. Grit – kleine Steinchen – zerreibt im Muskelmagen das Futter, denn Hühner haben keine Zähne.',
				points: 10,
				left: [
					{ id: 'hz2l1', text: 'Futterkalk (Calcium)' },
					{ id: 'hz2l2', text: 'Grit' },
					{ id: 'hz2l3', text: 'Eiweiß im Futter' },
					{ id: 'hz2l4', text: 'Frisches Wasser' }
				],
				right: [
					{ id: 'hz2r3', text: 'Muskeln und neue Federn' },
					{ id: 'hz2r4', text: 'Muss immer zugänglich sein' },
					{ id: 'hz2r1', text: 'Feste Eischale und Knochen' },
					{ id: 'hz2r2', text: 'Zerkleinert Futter im Muskelmagen' }
				],
				solution: [
					{ leftId: 'hz2l1', rightId: 'hz2r1' },
					{ leftId: 'hz2l2', rightId: 'hz2r2' },
					{ leftId: 'hz2l3', rightId: 'hz2r3' },
					{ leftId: 'hz2l4', rightId: 'hz2r4' }
				]
			},
			{
				id: 'hz3',
				type: 'match',
				prompt: 'Welches Bedürfnis erfüllt das im Stall? Ein Begriff kann mehrere Verbindungen haben.',
				explanation:
					'Der Auslauf erfüllt gleich zwei Bedürfnisse: Futtersuche und Bewegung. Eine gute Haltung bietet für jedes Bedürfnis passende Möglichkeiten.',
				points: 10,
				allowMultiple: true,
				left: [
					{ id: 'hz3l1', text: 'Erhöhte Sitzstange' },
					{ id: 'hz3l2', text: 'Staubbad mit Sand' },
					{ id: 'hz3l3', text: 'Auslauf mit Grünfläche' }
				],
				right: [
					{ id: 'hz3r3', text: 'Futtersuche' },
					{ id: 'hz3r1', text: 'Ruhen' },
					{ id: 'hz3r4', text: 'Bewegung' },
					{ id: 'hz3r2', text: 'Gefiederpflege' }
				],
				solution: [
					{ leftId: 'hz3l1', rightId: 'hz3r1' },
					{ leftId: 'hz3l2', rightId: 'hz3r2' },
					{ leftId: 'hz3l3', rightId: 'hz3r3' },
					{ leftId: 'hz3l3', rightId: 'hz3r4' }
				]
			}
		]
	},
	{
		id: 'q-huhn-zuordnen-en',
		topicId: 't-huehner-verhalten',
		lang: 'en',
		translationOf: 'q-huhn-zuordnen',
		title: 'What do hens need?',
		description: 'Three matching tasks on the behaviour, feed and housing of laying hens.',
		published: true,
		timerSeconds: null,
		createdAt: T('2026-11-10'),
		updatedAt: T('2026-11-10'),
		questions: [
			{
				id: 'hze1',
				type: 'match',
				prompt: 'What does the behaviour mean? Match them up.',
				explanation:
					'Hens show these behaviours on their own. If they lack the opportunity – a dust bath or a nest, for example – they become stressed.',
				points: 10,
				left: [
					{ id: 'hze1l1', text: 'Dust bathing' },
					{ id: 'hze1l2', text: 'Resting on perches' },
					{ id: 'hze1l3', text: 'Scratching and pecking' },
					{ id: 'hze1l4', text: 'Looking for a nest' }
				],
				right: [
					{ id: 'hze1r3', text: 'Searches for food' },
					{ id: 'hze1r1', text: 'Cares for its feathers, keeps parasites away' },
					{ id: 'hze1r4', text: 'Prepares to lay an egg' },
					{ id: 'hze1r2', text: 'Feels safe up high at night' }
				],
				solution: [
					{ leftId: 'hze1l1', rightId: 'hze1r1' },
					{ leftId: 'hze1l2', rightId: 'hze1r2' },
					{ leftId: 'hze1l3', rightId: 'hze1r3' },
					{ leftId: 'hze1l4', rightId: 'hze1r4' }
				]
			},
			{
				id: 'hze2',
				type: 'match',
				prompt: 'What does the hen need it for? Match them up.',
				explanation:
					'A hen needs a lot of calcium for every egg. Grit – small stones – grinds the feed in the gizzard, because chickens have no teeth.',
				points: 10,
				left: [
					{ id: 'hze2l1', text: 'Feed limestone (calcium)' },
					{ id: 'hze2l2', text: 'Grit' },
					{ id: 'hze2l3', text: 'Protein in the feed' },
					{ id: 'hze2l4', text: 'Fresh water' }
				],
				right: [
					{ id: 'hze2r3', text: 'Muscles and new feathers' },
					{ id: 'hze2r4', text: 'Must always be available' },
					{ id: 'hze2r1', text: 'Firm eggshells and bones' },
					{ id: 'hze2r2', text: 'Grinds feed in the gizzard' }
				],
				solution: [
					{ leftId: 'hze2l1', rightId: 'hze2r1' },
					{ leftId: 'hze2l2', rightId: 'hze2r2' },
					{ leftId: 'hze2l3', rightId: 'hze2r3' },
					{ leftId: 'hze2l4', rightId: 'hze2r4' }
				]
			},
			{
				id: 'hze3',
				type: 'match',
				prompt: 'Which need does it meet in the barn? One item can have several connections.',
				explanation:
					'The outdoor run meets two needs at once: searching for food and exercise. Good housing offers suitable options for every need.',
				points: 10,
				allowMultiple: true,
				left: [
					{ id: 'hze3l1', text: 'Raised perch' },
					{ id: 'hze3l2', text: 'Sand dust bath' },
					{ id: 'hze3l3', text: 'Outdoor run with grass' }
				],
				right: [
					{ id: 'hze3r3', text: 'Searching for food' },
					{ id: 'hze3r1', text: 'Resting' },
					{ id: 'hze3r4', text: 'Exercise' },
					{ id: 'hze3r2', text: 'Feather care' }
				],
				solution: [
					{ leftId: 'hze3l1', rightId: 'hze3r1' },
					{ leftId: 'hze3l2', rightId: 'hze3r2' },
					{ leftId: 'hze3l3', rightId: 'hze3r3' },
					{ leftId: 'hze3l3', rightId: 'hze3r4' }
				]
			}
		]
	},
	{
		id: 'q-futter',
		topicId: 't-methan',
		title: 'Futter oder Falle?',
		description: 'Vier Bilder, vier Entscheidungen.',
		published: false,
		timerSeconds: null,
		createdAt: T('2026-10-30'),
		updatedAt: T('2026-11-03'),
		questions: [
			{
				id: 'f1',
				type: 'image',
				prompt: 'Welches Futter ist besonders faserreich?',
				explanation: 'Heu und Gras liefern Strukturfasern, die Wiederkäuer brauchen.',
				points: 5,
				mode: 'choice',
				image: '🌾',
				options: [
					{ id: 'f1a', text: 'Heu', correct: true },
					{ id: 'f1b', text: 'Kraftfutter', correct: false },
					{ id: 'f1c', text: 'Melasse', correct: false }
				]
			},
			{
				id: 'f2',
				type: 'image',
				prompt: 'Welches Signal zeigt Schmerz beim Rind?',
				explanation: 'Ohrenstellung und Rückenhaltung sind wichtige Signale.',
				points: 5,
				mode: 'choice',
				image: '🐄',
				options: [
					{ id: 'f2a', text: 'Entspannt hängende Ohren', correct: false },
					{ id: 'f2b', text: 'Aufgestellte Ohren und gekrümmter Rücken', correct: true },
					{ id: 'f2c', text: 'Wiederkauen', correct: false }
				]
			},
			{
				id: 'f3',
				type: 'image',
				prompt: 'Was ist ein Zeichen für gutes Stallklima?',
				explanation: 'Trockene Liegeflächen und ruhige Tiere sprechen für gutes Klima.',
				points: 5,
				mode: 'choice',
				image: '🏠',
				options: [
					{ id: 'f3a', text: 'Beschlagene Fenster', correct: false },
					{ id: 'f3b', text: 'Trockene Liegeflächen', correct: true },
					{ id: 'f3c', text: 'Stechender Ammoniakgeruch', correct: false }
				]
			},
			{
				id: 'f4',
				type: 'image',
				prompt: 'Welches Futter liefert besonders viel Energie?',
				explanation: 'Mais ist energiereich – deshalb wird er gezielt eingesetzt.',
				points: 5,
				mode: 'choice',
				image: '🌽',
				options: [
					{ id: 'f4a', text: 'Mais', correct: true },
					{ id: 'f4b', text: 'Stroh', correct: false },
					{ id: 'f4c', text: 'Wasser', correct: false }
				]
			}
		]
	},
	{
		id: 'q-sensorik',
		topicId: 't-sensorik',
		title: 'Sensoren im Stall',
		description: 'Drei Fragen zu Präzisionslandwirtschaft und Tierwohl.',
		published: true,
		timerSeconds: null,
		createdAt: T('2026-11-01'),
		updatedAt: T('2026-11-05'),
		questions: [
			{
				id: 'p1',
				type: 'mc',
				prompt: 'Wozu erfassen Sensoren am Halsband einer Kuh Bewegungsdaten?',
				explanation:
					'Aktivitätssensoren erkennen Fresszeiten, Brunst und Lahmheit – das Tier bleibt im Mittelpunkt.',
				points: 10,
				multiple: false,
				options: [
					{ id: 'p1a', text: 'Um Aktivität und Gesundheitszustand zu erkennen', correct: true },
					{ id: 'p1b', text: 'Um die Farbe der Milch zu messen', correct: false },
					{ id: 'p1c', text: 'Um das Wetter vorherzusagen', correct: false }
				]
			},
			{
				id: 'p2',
				type: 'tf',
				prompt: 'Ein Beschleunigungssensor kann erkennen, ob eine Kuh liegt oder steht.',
				explanation:
					'Das Bewegungsmuster verrät viel über Liegezeiten und mögliche Erkrankungen.',
				points: 10,
				correct: true
			},
			{
				id: 'p3',
				type: 'mc',
				prompt: 'Was bedeutet Präzisionslandwirtschaft im Stall?',
				explanation:
					'Technik unterstützt das Management, ersetzt aber nicht die Beobachtung durch Menschen.',
				points: 10,
				multiple: false,
				options: [
					{
						id: 'p3a',
						text: 'Technik unterstützt das Management, das Tier bleibt im Mittelpunkt',
						correct: true
					},
					{ id: 'p3b', text: 'Alle Tiere werden gleich behandelt, egal was Sensoren zeigen', correct: false },
					{ id: 'p3c', text: 'Sensoren ersetzen die Beobachtung durch Menschen vollständig', correct: false }
				]
			}
		]
	}
];

export const seedGames: Game[] = [
	{
		id: 'g-pansen',
		topicId: 't-methan',
		title: 'Pansen-Puzzle',
		description: 'Finde die drei Futterbausteine, die Methan reduzieren.',
		kind: 'html',
		files: htmlFiles(pansenPuzzleHtml),
		maxPoints: 200,
		apiVersion: 1,
		triggerWarning: false,
		published: true,
		createdAt: T('2026-10-27'),
		updatedAt: T('2026-11-05')
	},
	{
		id: 'g-stallklima',
		topicId: 't-stallklima',
		title: 'Stallklima-Simulator',
		description: 'Stelle Temperatur und Luftfeuchte optimal ein.',
		kind: 'html',
		files: htmlFiles(stallklimaHtml),
		maxPoints: 150,
		apiVersion: 1,
		triggerWarning: false,
		published: true,
		createdAt: T('2026-11-04'),
		updatedAt: T('2026-11-04')
	}
];


/* ------------------------------------------------------------------ */
/* Beispiel-Quiz zum Hitzestress (DE + EN)                             */
/* ------------------------------------------------------------------ */

const stallImage = [{ id: 'qa-stall', name: 'Stall-Schema', mime: 'image/svg+xml', src: '/demo/stall-schema.svg' }];

export const hitzeQuizzes: Quiz[] = [
	{
		id: 'q-hitze',
		topicId: 't-hitze',
		lang: 'de',
		title: 'Hitzestress-Check',
		description: 'Fünf Fragen zur Ausstellung „Wenn es der Kuh zu heiß wird“.',
		published: true,
		timerSeconds: null,
		createdAt: T('2026-10-25'),
		updatedAt: T('2026-11-03'),
		questions: [
			{
				id: 'h1',
				type: 'mc',
				prompt: 'Welche zwei Werte fasst der Temperatur-Feuchte-Index (THI) zusammen?',
				explanation: 'Der THI kombiniert Lufttemperatur und relative Luftfeuchte. Feuchte Luft erschwert die Abgabe von Wärme.',
				points: 10,
				multiple: false,
				options: [
					{ id: 'h1a', text: 'Lufttemperatur und Luftfeuchte', correct: true },
					{ id: 'h1b', text: 'Körpergewicht und Milchmenge', correct: false },
					{ id: 'h1c', text: 'Windstärke und Sonnenstunden', correct: false }
				]
			},
			{
				id: 'h2',
				type: 'tf',
				prompt: 'Milchkühe geraten erst ab etwa 35 °C in Hitzestress.',
				explanation: 'Falsch. Schon ab rund 20 °C – je nach Luftfeuchte – kann Hitzestress beginnen.',
				points: 10,
				correct: false
			},
			{
				id: 'h3',
				type: 'image',
				prompt: 'Tippe im Bild auf den Ventilator.',
				explanation: 'Der Ventilator links sorgt für Luftbewegung im Tierbereich und führt Wärme ab.',
				points: 10,
				mode: 'click',
				mediaKind: 'image',
				media: stallImage,
				clickImageUrl: '/demo/stall-schema.svg',
				clickInstruction: 'Tippe oder klicke auf den Ventilator.',
				clickPolygon: [
					{ x: 0.09, y: 0.18 },
					{ x: 0.25, y: 0.18 },
					{ x: 0.25, y: 0.46 },
					{ x: 0.09, y: 0.46 }
				]
			},
			{
				id: 'h4',
				type: 'match',
				prompt: 'Ordne jede Maßnahme ihrer Wirkung zu.',
				explanation: 'Jede Maßnahme setzt an einer anderen Stelle an – am besten wirken sie zusammen.',
				points: 10,
				left: [
					{ id: 'h4l1', text: 'Ventilator' },
					{ id: 'h4l2', text: 'Sprühkühlung' },
					{ id: 'h4l3', text: 'Tränke' },
					{ id: 'h4l4', text: 'Schatten' }
				],
				right: [
					{ id: 'h4r1', text: 'Luftbewegung führt Wärme ab' },
					{ id: 'h4r2', text: 'Verdunstung kühlt das Fell' },
					{ id: 'h4r3', text: 'Ersetzt verlorene Flüssigkeit' },
					{ id: 'h4r4', text: 'Schützt vor direkter Sonne' }
				],
				solution: [
					{ leftId: 'h4l1', rightId: 'h4r1' },
					{ leftId: 'h4l2', rightId: 'h4r2' },
					{ leftId: 'h4l3', rightId: 'h4r3' },
					{ leftId: 'h4l4', rightId: 'h4r4' }
				]
			},
			{
				id: 'h5',
				type: 'mc',
				prompt: 'Woran erkennt man Hitzestress? (2 Antworten)',
				explanation: 'Schnelle Atmung und vermehrtes Stehen sind typische Anzeichen.',
				points: 10,
				multiple: true,
				options: [
					{ id: 'h5a', text: 'Schnellere Atmung', correct: true },
					{ id: 'h5b', text: 'Die Kuh steht mehr und liegt weniger', correct: true },
					{ id: 'h5c', text: 'Die Kuh frisst deutlich mehr', correct: false },
					{ id: 'h5d', text: 'Das Fell wird dunkler', correct: false }
				]
			}
		]
	},
	{
		id: 'q-hitze-en',
		topicId: 't-hitze',
		lang: 'en',
		translationOf: 'q-hitze',
		title: 'Heat stress check',
		description: 'Five questions on the exhibition “When it gets too hot for the cow”.',
		published: true,
		timerSeconds: null,
		createdAt: T('2026-10-26'),
		updatedAt: T('2026-11-03'),
		questions: [
			{
				id: 'he1',
				type: 'mc',
				prompt: 'Which two values does the temperature-humidity index (THI) combine?',
				explanation: 'The THI combines air temperature and relative humidity. Humid air makes it harder to release heat.',
				points: 10,
				multiple: false,
				options: [
					{ id: 'he1a', text: 'Air temperature and humidity', correct: true },
					{ id: 'he1b', text: 'Body weight and milk yield', correct: false },
					{ id: 'he1c', text: 'Wind speed and hours of sunshine', correct: false }
				]
			},
			{
				id: 'he2',
				type: 'tf',
				prompt: 'Dairy cows only experience heat stress from about 35 °C.',
				explanation: 'False. Heat stress can begin at around 20 °C, depending on humidity.',
				points: 10,
				correct: false
			},
			{
				id: 'he3',
				type: 'image',
				prompt: 'Tap the fan in the picture.',
				explanation: 'The fan on the left creates air movement in the animal area and carries heat away.',
				points: 10,
				mode: 'click',
				mediaKind: 'image',
				media: stallImage,
				clickImageUrl: '/demo/stall-schema.svg',
				clickInstruction: 'Tap or click the fan.',
				clickPolygon: [
					{ x: 0.09, y: 0.18 },
					{ x: 0.25, y: 0.18 },
					{ x: 0.25, y: 0.46 },
					{ x: 0.09, y: 0.46 }
				]
			},
			{
				id: 'he4',
				type: 'match',
				prompt: 'Match each measure to its effect.',
				explanation: 'Each measure works in a different way – they are most effective together.',
				points: 10,
				left: [
					{ id: 'he4l1', text: 'Fan' },
					{ id: 'he4l2', text: 'Sprinklers' },
					{ id: 'he4l3', text: 'Water trough' },
					{ id: 'he4l4', text: 'Shade' }
				],
				right: [
					{ id: 'he4r1', text: 'Air movement carries heat away' },
					{ id: 'he4r2', text: 'Evaporation cools the coat' },
					{ id: 'he4r3', text: 'Replaces lost fluid' },
					{ id: 'he4r4', text: 'Protects from direct sun' }
				],
				solution: [
					{ leftId: 'he4l1', rightId: 'he4r1' },
					{ leftId: 'he4l2', rightId: 'he4r2' },
					{ leftId: 'he4l3', rightId: 'he4r3' },
					{ leftId: 'he4l4', rightId: 'he4r4' }
				]
			},
			{
				id: 'he5',
				type: 'mc',
				prompt: 'How can you recognise heat stress? (2 answers)',
				explanation: 'Faster breathing and standing more are typical signs.',
				points: 10,
				multiple: true,
				options: [
					{ id: 'he5a', text: 'Faster breathing', correct: true },
					{ id: 'he5b', text: 'The cow stands more and lies down less', correct: true },
					{ id: 'he5c', text: 'The cow eats much more', correct: false },
					{ id: 'he5d', text: 'The coat turns darker', correct: false }
				]
			}
		]
	}
];

/* ------------------------------------------------------------------ */
/* Redaktion: Benutzer, Protokoll                                      */
/* ------------------------------------------------------------------ */

export const seedUsers: EditorUser[] = [
	{ id: 'u-admin', name: 'Jana Krüger', email: 'j.krueger@example.org', role: 'admin', active: true, lastLoginAt: T('2026-11-09', 8) },
	{ id: 'u-editor', name: 'Tom Albers', email: 't.albers@example.org', role: 'editor', active: true, lastLoginAt: T('2026-11-09', 10) },
	{ id: 'u-review', name: 'Dr. Lea Hoffmann', email: 'l.hoffmann@example.org', role: 'reviewer', active: true, lastLoginAt: T('2026-11-08', 14) },
	{ id: 'u-analyst', name: 'Sven Ruhl', email: 's.ruhl@example.org', role: 'analyst', active: true, lastLoginAt: T('2026-11-06', 9) },
	{ id: 'u-old', name: 'Praktikant (deaktiviert)', email: 'praktikum@example.org', role: 'editor', active: false }
];

const audit = (id: string, at: string, userId: string, action: string, target: string, level: 'info' | 'security' = 'info'): AuditEntry => ({ id, at, userId, action, target, level });

export const seedAudit: AuditEntry[] = [
	audit('a1', T('2026-11-09', 10), 'u-editor', 'Anmeldung erfolgreich', 'Redaktion', 'security'),
	audit('a2', T('2026-11-08', 15), 'u-editor', 'Zur Prüfung eingereicht', 'Warum Schweine wühlen müssen'),
	audit('a3', T('2026-11-08', 14), 'u-review', 'Anmeldung erfolgreich', 'Redaktion', 'security'),
	audit('a4', T('2026-11-07', 11), 'u-admin', 'Rolle geändert: Redaktion → deaktiviert', 'Praktikant (deaktiviert)', 'security'),
	audit('a5', T('2026-11-03', 16), 'u-review', 'Veröffentlicht', 'Wenn es der Kuh zu heiß wird'),
	audit('a6', T('2026-11-03', 9), 'u-editor', 'Medium hochgeladen', 'Faktenblatt Hitzestress (PDF)'),
	audit('a7', T('2026-11-02', 8), 'u-admin', 'Fehlgeschlagener Anmeldeversuch', 'unbekannt@example.org', 'security'),
	audit('a8', T('2026-10-28', 12), 'u-review', 'Veröffentlicht', 'Methan aus dem Pansen')
];

/* ------------------------------------------------------------------ */
/* Statistik – aggregierte Demo-Zahlen                                 */
/* ------------------------------------------------------------------ */

function demoDaily(): Record<string, number> {
	const out: Record<string, number> = {};
	const end = new Date('2026-11-09T00:00:00Z');
	for (let i = 29; i >= 0; i--) {
		const d = new Date(end);
		d.setUTCDate(end.getUTCDate() - i);
		const weekday = d.getUTCDay();
		const base = 180 + Math.round(60 * Math.sin(i / 4)) + (29 - i) * 4;
		out[d.toISOString().slice(0, 10)] = weekday === 0 || weekday === 6 ? Math.round(base * 0.6) : base;
	}
	return out;
}

export const seedStats: StatsData = {
	daily: demoDaily(),
	exhibitions: {
		'e-hitzestress': 1840,
		'e-methan': 1210,
		'e-stallklima': 760,
		'e-sensoren': 540,
		'e-huehner': 410
	},
	categories: { 'c-rind': 3590, 'c-schwein': 760, 'c-gefluegel': 410 },
	quizStarts: { 'q-hitze': 620, 'q-hitze-en': 48, 'q-methan': 455, 'q-stallklima': 210, 'q-sensorik': 130 },
	quizCompletions: { 'q-hitze': 512, 'q-hitze-en': 39, 'q-methan': 371, 'q-stallklima': 168, 'q-sensorik': 97 },
	quizScore: {
		'q-hitze': { sum: 512 * 0.74, n: 512 },
		'q-hitze-en': { sum: 39 * 0.69, n: 39 },
		'q-methan': { sum: 371 * 0.63, n: 371 },
		'q-stallklima': { sum: 168 * 0.81, n: 168 },
		'q-sensorik': { sum: 97 * 0.7, n: 97 }
	},
	searches: { hitze: 96, methan: 71, kuh: 64, schwein: 40, stall: 33, tierwohl: 28, sensor: 12 },
	dwell: {}
};

export const seedStatsConfig: StatsConfig = {
	pageviews: true,
	topics: true,
	interactions: true,
	successRates: true,
	searchTerms: true,
	dwellTime: false,
	retentionDays: 180
};

export const seedSettings: Settings = {
	platformName: 'Nutztierkosmos',
	subtitle: {
		de: 'Forschung zu Nutztieren – verständlich erklärt vom Forschungsinstitut für Nutztierbiologie.',
		en: 'Research on farm animals – clearly explained by the Research Institute for Farm Animal Biology.'
	},
	pointsPerAnswer: 10,
	gamification: true,
	englishEnabled: true,
	downloads: 'released',
	presentationMode: true,
	contactEmail: 'kommunikation@example.org'
};

export const seedPrefs: Preferences = {
	hideTriggerWarnings: false
};

export const seedQuizzes: Quiz[] = [...hitzeQuizzes, ...baseQuizzes];
