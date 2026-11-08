import type {
	Game,
	GameFile,
	Module,
	Player,
	Quiz,
	Score,
	Settings,
	Preferences
} from '$lib/types';
import { pansenPuzzleHtml, stallklimaHtml } from '$lib/games/seed-games';

export const SEED_VERSION = 3;

const T = (d: string) => new Date(`${d}T09:00:00.000Z`).toISOString();

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

export const seedModules: Module[] = [
	{
		id: 'm-milch',
		title: 'Milchkuh & Klima',
		subtitle: 'Wie aus Gras Milch wird',
		description: 'Wie aus Gras Milch wird – und was das mit Methan zu tun hat.',
		emoji: '🐄',
		color: 'forest',
		published: true,
		order: 1
	},
	{
		id: 'm-schwein',
		title: 'Schwein & Stallklima',
		subtitle: 'Wohlfühltemperatur und Luft',
		description: 'Wohlfühltemperatur, Luft und Verhalten im Stall.',
		emoji: '🐖',
		color: 'amber',
		published: true,
		order: 2
	},
	{
		id: 'm-gefluegel',
		title: 'Geflügel & Verhalten',
		subtitle: 'Was Hühner uns verraten',
		description: 'Was Hühner uns über gutes Management verraten.',
		emoji: '🐔',
		color: 'sky',
		published: true,
		order: 3
	},
	{
		id: 'm-praezision',
		title: 'Präzisionslandwirtschaft',
		subtitle: 'Sensoren und Daten',
		description: 'Sensoren, Daten und das Tier im Mittelpunkt.',
		emoji: '🛰️',
		color: 'berry',
		published: true,
		order: 4
	}
];

export const seedQuizzes: Quiz[] = [
	{
		id: 'q-methan',
		moduleId: 'm-milch',
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
		moduleId: 'm-schwein',
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
		id: 'q-futter',
		moduleId: 'm-milch',
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
		moduleId: 'm-praezision',
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
		moduleId: 'm-milch',
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
		moduleId: 'm-schwein',
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

export const seedPlayers: Player[] = [
	{ id: 'p-lena', name: 'Lena', avatar: '🦊', createdAt: T('2026-10-20'), lastActiveAt: T('2026-11-06') },
	{ id: 'p-jonas', name: 'Jonas', avatar: '🐻', createdAt: T('2026-10-21'), lastActiveAt: T('2026-11-05') },
	{ id: 'p-mia', name: 'Mia', avatar: '🦉', createdAt: T('2026-10-22'), lastActiveAt: T('2026-11-04') },
	{ id: 'p-emre', name: 'Emre', avatar: '🐺', createdAt: T('2026-10-24'), lastActiveAt: T('2026-11-02') },
	{ id: 'p-weber', name: 'Frau Weber', avatar: '👩‍🏫', createdAt: T('2026-10-19'), lastActiveAt: T('2026-10-30') }
];

const score = (
	id: string,
	playerId: string,
	refType: 'quiz' | 'game',
	refId: string,
	points: number,
	maxPoints: number,
	day: string
): Score => ({
	id,
	playerId,
	refType,
	refId,
	points,
	maxPoints,
	durationMs: 240000,
	at: T(day)
});

export const seedScores: Score[] = [
	score('sc1', 'p-lena', 'game', 'g-pansen', 200, 200, '2026-11-01'),
	score('sc2', 'p-lena', 'quiz', 'q-methan', 60, 60, '2026-10-31'),
	score('sc3', 'p-lena', 'game', 'g-stallklima', 150, 150, '2026-11-03'),
	score('sc4', 'p-lena', 'quiz', 'q-futter', 15, 20, '2026-11-04'),
	score('sc5', 'p-jonas', 'game', 'g-pansen', 200, 200, '2026-11-02'),
	score('sc6', 'p-jonas', 'quiz', 'q-methan', 60, 60, '2026-11-02'),
	score('sc7', 'p-jonas', 'game', 'g-stallklima', 140, 150, '2026-11-03'),
	score('sc8', 'p-mia', 'game', 'g-pansen', 200, 200, '2026-11-03'),
	score('sc9', 'p-mia', 'quiz', 'q-methan', 60, 60, '2026-11-03'),
	score('sc10', 'p-mia', 'game', 'g-stallklima', 130, 150, '2026-11-04'),
	score('sc11', 'p-emre', 'game', 'g-pansen', 150, 200, '2026-11-01'),
	score('sc12', 'p-emre', 'quiz', 'q-methan', 60, 60, '2026-11-02'),
	score('sc13', 'p-weber', 'quiz', 'q-methan', 60, 60, '2026-10-30')
];

export const seedSettings: Settings = {
	platformName: 'Nutztierkosmos',
	subtitle: 'Das Forschungsinstitut FBN erklärt, wie Nutztierhaltung wirklich funktioniert.',
	pointsPerAnswer: 10,
	levelThresholds: { forscher: 150, forscherin: 300 },
	leaderboardPublic: true
};

export const seedPrefs: Preferences = {
	hideTriggerWarnings: false,
};
