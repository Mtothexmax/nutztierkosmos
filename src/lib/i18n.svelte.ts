import { browser } from '$app/env';
import { read, storageKeys, write } from '$lib/storage/db';
import type { L10n, Locale } from '$lib/types';

/**
 * Oberflächentexte (Navigation, Buttons, Hinweise) in Deutsch und Englisch.
 * Die Redaktion kann jeden Eintrag unter „Texte & Übersetzungen“ überschreiben (LB 7).
 */
export const uiDictionary = {
	'site.skip': { de: 'Zum Inhalt springen', en: 'Skip to content' },
	'site.tagline': { de: 'Wissen aus der Nutztierforschung', en: 'Knowledge from farm animal research' },
	'nav.home': { de: 'Start', en: 'Home' },
	'nav.topics': { de: 'Themen', en: 'Topics' },
	'nav.search': { de: 'Suche', en: 'Search' },
	'nav.participate': { de: 'Mitmachen', en: 'Get involved' },
	'nav.about': { de: 'Über uns', en: 'About' },
	'nav.menu': { de: 'Menü', en: 'Menu' },
	'nav.close': { de: 'Menü schließen', en: 'Close menu' },
	'nav.main': { de: 'Hauptnavigation', en: 'Main navigation' },
	'nav.breadcrumb': { de: 'Sie sind hier', en: 'You are here' },
	'lang.switch': { de: 'Sprache wählen', en: 'Choose language' },
	'lang.de': { de: 'Deutsch', en: 'German' },
	'lang.en': { de: 'Englisch', en: 'English' },
	'lang.missing': {
		de: 'Dieser Inhalt ist noch nicht auf Englisch verfügbar. Wir zeigen die deutsche Fassung.',
		en: 'This content is not yet available in English. We are showing the German version.'
	},
	'lang.missingShort': { de: 'nur auf Deutsch', en: 'German only' },
	'home.title': { de: 'Forschung, die man versteht', en: 'Research you can understand' },
	'home.searchLabel': { de: 'Wonach suchen Sie?', en: 'What are you looking for?' },
	'home.searchPlaceholder': { de: 'z. B. Hitzestress, Methan, Legehennen', en: 'e.g. heat stress, methane, laying hens' },
	'home.popular': { de: 'Häufig gesucht', en: 'Popular searches' },
	'home.byAnimal': { de: 'Nach Tierart entdecken', en: 'Explore by animal' },
	'home.latest': { de: 'Neue Ausstellungen', en: 'New exhibitions' },
	'home.allExhibitions': { de: 'Alle Ausstellungen', en: 'All exhibitions' },
	'home.audiencesTitle': { de: 'Einstiege für', en: 'Starting points for' },
	'home.participateTitle': { de: 'Wissen testen – ganz ohne Anmeldung', en: 'Test your knowledge – no sign-up needed' },
	'home.participateText': {
		de: 'Zu vielen Ausstellungen gibt es Quizze und kleine Spiele. Wer mag, sammelt Abzeichen im Forscherpass.',
		en: 'Many exhibitions come with quizzes and small games. If you like, collect badges in your researcher pass.'
	},
	'home.participateCta': { de: 'Zu den Quizzen', en: 'Go to the quizzes' },
	'home.stats': { de: '{n} Ausstellungen · {p} Publikationen · {q} Quizze', en: '{n} exhibitions · {p} publications · {q} quizzes' },
	'audience.allgemein': { de: 'Alle Interessierten', en: 'Everyone' },
	'audience.schule': { de: 'Schule', en: 'Schools' },
	'audience.studium': { de: 'Studium & Wissenschaft', en: 'Students & researchers' },
	'audience.presse': { de: 'Presse', en: 'Press' },
	'audience.schule.text': { de: 'Ausstellungen mit Quiz für den Unterricht', en: 'Exhibitions with quizzes for the classroom' },
	'audience.studium.text': { de: 'Publikationen und Quellen im Überblick', en: 'Publications and sources at a glance' },
	'audience.presse.text': { de: 'Faktenblätter, Medien und Ansprechpersonen', en: 'Fact sheets, media and contacts' },
	'audience.allgemein.text': { de: 'Alle Themen verständlich erklärt', en: 'All topics clearly explained' },
	'topics.title': { de: 'Themen', en: 'Topics' },
	'topics.intro': {
		de: 'Unsere Forschung gegliedert nach Tierarten und Themenschwerpunkten.',
		en: 'Our research organised by animal and focus topic.'
	},
	'topics.focus': { de: 'Themenschwerpunkte', en: 'Focus topics' },
	'topics.exhibitions': { de: '{n} Ausstellungen', en: '{n} exhibitions' },
	'topics.exhibitions1': { de: '1 Ausstellung', en: '1 exhibition' },
	'topics.none': { de: 'Zu diesem Thema gibt es noch keine Ausstellung.', en: 'There is no exhibition on this topic yet.' },
	'exh.minutes': { de: '{n} Min. Lesezeit', en: '{n} min read' },
	'exh.basedOn': { de: 'Grundlage dieser Ausstellung', en: 'This exhibition is based on' },
	'exh.publication': { de: 'Publikation', en: 'Publication' },
	'exh.authors': { de: 'Autorinnen und Autoren', en: 'Authors' },
	'exh.published': { de: 'Veröffentlicht', en: 'Published' },
	'exh.toPublication': { de: 'Zur Publikation', en: 'View publication' },
	'exh.cite': { de: 'Quellenangabe', en: 'Citation' },
	'exh.keywords': { de: 'Schlagwörter', en: 'Keywords' },
	'exh.related': { de: 'Weitere Ausstellungen', en: 'More exhibitions' },
	'exh.updated': { de: 'Zuletzt aktualisiert', en: 'Last updated' },
	'exh.contents': { de: 'Inhalt', en: 'Contents' },
	'exh.testKnowledge': { de: 'Teste dein Wissen', en: 'Test your knowledge' },
	'exh.optional': {
		de: 'Freiwillig – alle Inhalte sind auch ohne Quiz oder Spiel vollständig.',
		en: 'Optional – all content is complete without any quiz or game.'
	},
	'exh.startQuiz': { de: 'Quiz starten', en: 'Start quiz' },
	'exh.startGame': { de: 'Spiel starten', en: 'Start game' },
	'exh.questions': { de: '{n} Fragen', en: '{n} questions' },
	'exh.game': { de: 'Mini-Spiel', en: 'Mini game' },
	'exh.preview': { de: 'Vorschau – diese Fassung ist noch nicht veröffentlicht.', en: 'Preview – this version is not yet published.' },
	'exh.backToEditor': { de: 'Zurück zum Editor', en: 'Back to editor' },
	'exh.notFound': { de: 'Diese Ausstellung gibt es nicht oder nicht mehr.', en: 'This exhibition does not exist or is no longer available.' },
	'exh.read': { de: 'Gelesen', en: 'Read' },
	'media.transcript': { de: 'Transkript anzeigen', en: 'Show transcript' },
	'media.download': { de: 'Herunterladen', en: 'Download' },
	'media.open': { de: 'Öffnen', en: 'Open' },
	'media.noDownload': { de: 'Download nicht freigegeben', en: 'Download not available' },
	'media.prev': { de: 'Vorheriges Bild', en: 'Previous image' },
	'media.next': { de: 'Nächstes Bild', en: 'Next image' },
	'media.imageOf': { de: 'Bild {i} von {n}', en: 'Image {i} of {n}' },
	'media.subtitles': { de: 'Untertitel verfügbar', en: 'Subtitles available' },
	'info.source': { de: 'Quelle', en: 'Source' },
	'info.temperature': { de: 'Lufttemperatur', en: 'Air temperature' },
	'info.humidity': { de: 'Relative Luftfeuchte', en: 'Relative humidity' },
	'info.thi': { de: 'Temperatur-Feuchte-Index', en: 'Temperature-humidity index' },
	'info.level0': { de: 'Kein Hitzestress', en: 'No heat stress' },
	'info.level1': { de: 'Leichter Hitzestress', en: 'Mild heat stress' },
	'info.level2': { de: 'Mäßiger Hitzestress', en: 'Moderate heat stress' },
	'info.level3': { de: 'Starker Hitzestress', en: 'Severe heat stress' },
	'info.level4': { de: 'Extremer Hitzestress', en: 'Extreme heat stress' },
	'info.level0.text': { de: 'Die Kuh kann ihre Wärme gut abgeben.', en: 'The cow can release its heat well.' },
	'info.level1.text': { de: 'Atmung wird schneller, erste Leistungseinbußen möglich.', en: 'Breathing speeds up, first drops in performance are possible.' },
	'info.level2.text': { de: 'Deutlich weniger Futteraufnahme, die Milchleistung sinkt.', en: 'Feed intake drops noticeably, milk yield falls.' },
	'info.level3.text': { de: 'Starke Belastung – Kühlung ist dringend nötig.', en: 'Severe strain – cooling is urgently needed.' },
	'info.level4.text': { de: 'Lebensbedrohlich – sofort handeln.', en: 'Life-threatening – act immediately.' },
	'info.tapHotspot': { de: 'Wählen Sie einen Punkt im Bild oder in der Liste.', en: 'Select a point in the image or in the list.' },
	'info.selectBar': { de: 'Wählen Sie einen Balken für die Erklärung.', en: 'Select a bar for the explanation.' },
	'info.asTable': { de: 'Als Tabelle anzeigen', en: 'Show as table' },
	'info.example': { de: 'Beispiel', en: 'Example' },
	'search.title': { de: 'Suche', en: 'Search' },
	'search.label': { de: 'Suchbegriff', en: 'Search term' },
	'search.submit': { de: 'Suchen', en: 'Search' },
	'search.animal': { de: 'Tierart', en: 'Animal' },
	'search.field': { de: 'Themengebiet', en: 'Subject area' },
	'search.type': { de: 'Inhaltstyp', en: 'Content type' },
	'search.keyword': { de: 'Schlagwort', en: 'Keyword' },
	'search.all': { de: 'Alle', en: 'All' },
	'search.sort': { de: 'Sortierung', en: 'Sort by' },
	'search.sortRelevance': { de: 'Relevanz', en: 'Relevance' },
	'search.sortDate': { de: 'Aktualität', en: 'Most recent' },
	'search.sortTitle': { de: 'Titel A–Z', en: 'Title A–Z' },
	'search.filters': { de: 'Filter', en: 'Filters' },
	'search.showFilters': { de: 'Filter anzeigen', en: 'Show filters' },
	'search.reset': { de: 'Filter zurücksetzen', en: 'Reset filters' },
	'search.results': { de: '{n} Ergebnisse', en: '{n} results' },
	'search.results1': { de: '1 Ergebnis', en: '1 result' },
	'search.none': { de: 'Keine Treffer. Versuchen Sie einen anderen Begriff oder entfernen Sie Filter.', en: 'No results. Try another term or remove filters.' },
	'search.typeExhibition': { de: 'Ausstellung', en: 'Exhibition' },
	'search.typePublication': { de: 'Publikation', en: 'Publication' },
	'search.typeQuiz': { de: 'Quiz', en: 'Quiz' },
	'search.logic': {
		de: 'Relevanz: Treffer im Titel zählen am meisten, dann Schlagwörter, Kurztext und Volltext. Aktualität: neueste zuerst.',
		en: 'Relevance: matches in the title count most, then keywords, summary and full text. Most recent: newest first.'
	},
	'part.title': { de: 'Mitmachen', en: 'Get involved' },
	'part.intro': {
		de: 'Quizze und Spiele sind ein freiwilliges Extra. Alle Inhalte sind auch ohne sie vollständig erreichbar.',
		en: 'Quizzes and games are an optional extra. All content is fully accessible without them.'
	},
	'part.activities': { de: 'Quizze und Spiele', en: 'Quizzes and games' },
	'part.activitiesIntro': {
		de: 'Nach Tierart geordnet. Ob Quiz oder Spiel – alles ist freiwillig und ohne Anmeldung.',
		en: 'Sorted by animal. Quiz or game – everything is optional and needs no sign-in.'
	},
	'part.none': { de: 'Zu dieser Tierart gibt es noch keine Quizze oder Spiele.', en: 'There are no quizzes or games for this animal yet.' },
	'act.quiz': { de: 'Quiz', en: 'Quiz' },
	'act.game': { de: 'Spiel', en: 'Game' },
	'act.gameMeta': { de: 'Interaktives Spiel', en: 'Interactive game' },
	'part.pass': { de: 'Forscherpass', en: 'Researcher pass' },
	'part.passIntro': {
		de: 'Ihr Fortschritt wird nur auf diesem Gerät gespeichert – ohne Namen, ohne Konto, ohne Übertragung an uns.',
		en: 'Your progress is stored only on this device – no name, no account, nothing sent to us.'
	},
	'part.passEnable': { de: 'Forscherpass auf diesem Gerät aktivieren', en: 'Activate researcher pass on this device' },
	'part.passDisable': { de: 'Forscherpass löschen', en: 'Delete researcher pass' },
	'part.passActive': { de: 'Forscherpass aktiv', en: 'Researcher pass active' },
	'part.badges': { de: 'Abzeichen', en: 'Badges' },
	'part.badgeEarned': { de: '(erreicht)', en: '(earned)' },
	'part.badgeLocked': { de: '(noch nicht erreicht)', en: '(not yet earned)' },
	'part.progress': { de: '{a} von {b} Ausstellungen gelesen · {c} Quizze und Spiele abgeschlossen', en: '{a} of {b} exhibitions read · {c} quizzes and games completed' },
	'part.disabled': { de: 'Spielerische Elemente sind derzeit deaktiviert.', en: 'Game elements are currently switched off.' },
	'part.toExhibition': { de: 'Zur Ausstellung', en: 'To the exhibition' },
	'part.best': { de: 'Bestes Ergebnis: {p} %', en: 'Best result: {p}%' },
	'badge.first': { de: 'Erste Schritte', en: 'First steps' },
	'badge.first.text': { de: 'Eine Ausstellung gelesen', en: 'Read one exhibition' },
	'badge.explorer': { de: 'Entdecker', en: 'Explorer' },
	'badge.explorer.text': { de: 'Ausstellungen aus allen Tierarten gelesen', en: 'Read exhibitions on every animal' },
	'badge.quiz': { de: 'Wissens-Profi', en: 'Knowledge pro' },
	'badge.quiz.text': { de: 'Drei Quizze oder Spiele mit mindestens 80 % abgeschlossen', en: 'Completed three quizzes or games with at least 80%' },
	'badge.heat': { de: 'Hitzeschutz', en: 'Heat guardian' },
	'badge.heat.text': { de: 'Den Hitzestress-Check bestanden', en: 'Passed the heat stress check' },
	'footer.institute': { de: 'Ein Angebot des Forschungsinstituts für Nutztierbiologie (FBN), Dummerstorf', en: 'A service of the Research Institute for Farm Animal Biology (FBN), Dummerstorf' },
	'footer.imprint': { de: 'Impressum', en: 'Legal notice' },
	'footer.privacy': { de: 'Datenschutz', en: 'Privacy' },
	'footer.accessibility': { de: 'Barrierefreiheit', en: 'Accessibility' },
	'footer.contact': { de: 'Kontakt', en: 'Contact' },
	'footer.editor': { de: 'Redaktion', en: 'Editorial login' },
	'footer.demo': { de: 'Demo-Version · Inhalte und Publikationen sind Platzhalter', en: 'Demo version · contents and publications are placeholders' },
	'common.back': { de: 'Zurück', en: 'Back' },
	'common.more': { de: 'Mehr erfahren', en: 'Learn more' },
	'common.close': { de: 'Schließen', en: 'Close' },
	'common.notFound': { de: 'Seite nicht gefunden', en: 'Page not found' },
	'common.toHome': { de: 'Zur Startseite', en: 'Go to home page' }
} satisfies Record<string, L10n>;

export type UiKey = keyof typeof uiDictionary;

class I18n {
	locale = $state<Locale>('de');
	overrides = $state<Partial<Record<UiKey, L10n>>>({});
	/** Wird vom Content-Store gesetzt, wenn Englisch abgeschaltet ist. */
	englishEnabled = $state(true);

	init(): void {
		if (!browser) return;
		const stored = read<Locale | null>(storageKeys.locale, null);
		const fromUrl = new URL(location.href).searchParams.get('lang');
		this.locale = fromUrl === 'en' || fromUrl === 'de' ? fromUrl : (stored ?? 'de');
		this.overrides = read(storageKeys.uiTexts, {});
		this.apply();
	}

	/** Sprachwechsel ohne Seitenwechsel – der Nutzungskontext bleibt erhalten (LB 7). */
	set(locale: Locale): void {
		this.locale = locale;
		write(storageKeys.locale, locale);
		this.apply();
	}

	saveOverrides(): void {
		write(storageKeys.uiTexts, this.overrides);
	}

	private apply(): void {
		if (browser) document.documentElement.lang = this.locale;
	}

	get active(): Locale {
		return this.englishEnabled ? this.locale : 'de';
	}

	t(key: UiKey, vars?: Record<string, string | number>): string {
		const entry = this.overrides[key] ?? uiDictionary[key];
		let text = (this.active === 'en' ? entry.en : entry.de) || entry.de || uiDictionary[key].de;
		if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
		return text;
	}

	/** Inhalt in der aktiven Sprache; fehlt die Übersetzung, kommt Deutsch. */
	tr(value: L10n | undefined): string {
		if (!value) return '';
		return this.active === 'en' && value.en?.trim() ? value.en : value.de;
	}

	/** true, wenn Englisch gewählt ist, der Text aber nur auf Deutsch vorliegt. */
	missing(value: L10n | undefined): boolean {
		return this.active === 'en' && Boolean(value?.de) && !value?.en?.trim();
	}

	/** lang-Attribut für einen Text (Screenreader sollen die richtige Sprache vorlesen). */
	langOf(value: L10n | undefined): Locale {
		return this.missing(value) ? 'de' : this.active;
	}

	date(iso: string | undefined, long = false): string {
		if (!iso) return '–';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '–';
		return d.toLocaleDateString(this.active === 'en' ? 'en-GB' : 'de-DE', {
			day: 'numeric',
			month: long ? 'long' : '2-digit',
			year: 'numeric'
		});
	}
}

export const i18n = new I18n();
export const t = (key: UiKey, vars?: Record<string, string | number>) => i18n.t(key, vars);
export const tr = (value: L10n | undefined) => i18n.tr(value);
