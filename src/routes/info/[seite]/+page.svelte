<script lang="ts">
	import { page } from '$app/state';
	import Breadcrumbs from '$lib/components/site/Breadcrumbs.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';

	type Section = { h: string; p: string[] };
	type InfoPage = { title: string; intro: string; sections: Section[] };

	let slug = $derived(page.params.seite ?? '');
	showReqs(['a11y', 'a11y-statement', 'privacy', 'i18n']);

	const pages: Record<string, { de: InfoPage; en: InfoPage }> = {
		ueber: {
			de: {
				title: 'Über den Nutztierkosmos',
				intro: 'Der Nutztierkosmos macht Forschung des Forschungsinstituts für Nutztierbiologie (FBN) für alle verständlich – für Interessierte, Schulen, Studierende und die Presse.',
				sections: [
					{ h: 'Wie die Inhalte entstehen', p: ['Jede Ausstellung beruht auf einer oder mehreren Veröffentlichungen des FBN. Die Redaktion fasst die Ergebnisse verständlich zusammen, eine Wissenschaftlerin oder ein Wissenschaftler prüft die Fassung fachlich, bevor sie erscheint.'] },
					{ h: 'Mitmachen ohne Anmeldung', p: ['Quizze und Spiele sind ein freiwilliges Extra. Sie brauchen dafür kein Konto. Wer möchte, kann einen Forscherpass aktivieren, der nur auf dem eigenen Gerät gespeichert wird.'] },
					{ h: 'Hinweis zur Demo', p: ['Diese Version ist ein Entwurf zur Abstimmung. Publikationen, Personen und Zahlen sind Platzhalter.'] }
				]
			},
			en: {
				title: 'About Nutztierkosmos',
				intro: 'Nutztierkosmos makes the research of the Research Institute for Farm Animal Biology (FBN) understandable for everyone – the interested public, schools, students and the press.',
				sections: [
					{ h: 'How the content is created', p: ['Every exhibition is based on one or more FBN publications. The editorial team summarises the findings clearly, and a researcher reviews the text before it is published.'] },
					{ h: 'Get involved without signing up', p: ['Quizzes and games are an optional extra. You do not need an account. If you like, you can activate a researcher pass that is stored only on your own device.'] },
					{ h: 'About this demo', p: ['This version is a draft for discussion. Publications, people and figures are placeholders.'] }
				]
			}
		},
		barrierefreiheit: {
			de: {
				title: 'Erklärung zur Barrierefreiheit',
				intro: 'Das FBN ist bemüht, den Nutztierkosmos im Einklang mit der Barrierefreie-Informationstechnik-Verordnung (BITV 2.0) und der EN 301 549 barrierefrei zugänglich zu machen.',
				sections: [
					{ h: 'Stand der Vereinbarkeit', p: ['Diese Website ist mit den Anforderungen teilweise vereinbar (Stand der Demo: November 2026). Vor der Abnahme wird die Umsetzung durch eine dokumentierte Prüfung nachgewiesen.'] },
					{ h: 'Bereits umgesetzt', p: ['Bedienung vollständig per Tastatur, sichtbarer Fokus, Sprunglink zum Inhalt, semantische Überschriften und Landmarken, Alternativtexte für Bilder, Untertitel und Transkripte für Video und Audio, Kontraste nach WCAG AA, Informationen nicht allein über Farbe, Sprachkennzeichnung bei fehlender Übersetzung, Berücksichtigung von „Bewegung reduzieren“.'] },
					{ h: 'Bekannte Einschränkungen und Behebungsplan', p: ['Zuordnungsaufgaben: Die Linien werden per Zeiger gezogen; eine Tastatur-Alternative ist vorhanden, die Ansage der Verbindungen wird bis zur Abnahme verbessert.', 'Eingebettete HTML-Spiele: Für Spiele von Dritten kann die Barrierefreiheit nicht garantiert werden. Inhalte sind stets auch ohne Spiel vollständig zugänglich.', 'PDF-Dokumente: Ältere PDFs sind ggf. nicht vollständig getaggt; sie werden schrittweise ersetzt.'] },
					{ h: 'Feedback und Kontakt', p: [`Sind Ihnen Mängel aufgefallen? Schreiben Sie uns: ${content.settings.contactEmail}. Wir antworten innerhalb von zwei Wochen.`] },
					{ h: 'Durchsetzungsverfahren', p: ['Wenn Sie keine zufriedenstellende Antwort erhalten, können Sie sich an die zuständige Schlichtungs- bzw. Durchsetzungsstelle wenden (wird im Echtbetrieb vom FBN benannt).'] }
				]
			},
			en: {
				title: 'Accessibility statement',
				intro: 'FBN strives to make Nutztierkosmos accessible in line with the German Accessible Information Technology Ordinance (BITV 2.0) and EN 301 549.',
				sections: [
					{ h: 'Compliance status', p: ['This website is partially compliant (demo status: November 2026). Compliance will be verified by a documented test before acceptance.'] },
					{ h: 'Already implemented', p: ['Full keyboard operation, visible focus, skip link, semantic headings and landmarks, alternative text for images, subtitles and transcripts for video and audio, WCAG AA contrast, information not conveyed by colour alone, language marking for untranslated content, support for “reduce motion”.'] },
					{ h: 'Known limitations and remediation plan', p: ['Matching tasks: lines are drawn with a pointer; a keyboard alternative exists, and the announcement of connections will be improved before acceptance.', 'Embedded HTML games: accessibility cannot be guaranteed for third-party games. Content is always fully accessible without the game.', 'PDF documents: older PDFs may not be fully tagged; they are being replaced step by step.'] },
					{ h: 'Feedback and contact', p: [`Have you noticed any barriers? Write to us: ${content.settings.contactEmail}. We will reply within two weeks.`] },
					{ h: 'Enforcement procedure', p: ['If you do not receive a satisfactory answer, you can contact the responsible conciliation or enforcement body (to be named by FBN in production).'] }
				]
			}
		},
		datenschutz: {
			de: {
				title: 'Datenschutz',
				intro: 'Der Nutztierkosmos kommt ohne Cookies, ohne Konto und ohne Tracking-Dienste von Drittanbietern aus.',
				sections: [
					{ h: 'Was auf Ihrem Gerät gespeichert wird', p: ['Technisch notwendig: die gewählte Sprache.', 'Nur mit Ihrer Zustimmung: der Forscherpass (gelesene Ausstellungen, Quiz-Ergebnisse). Er bleibt auf Ihrem Gerät und lässt sich jederzeit unter „Mitmachen“ löschen.'] },
					{ h: 'Nutzungsstatistik', p: ['Wir zählen Seitenaufrufe, beliebte Themen, Suchbegriffe und Quiz-Ergebnisse nur als Summen – ohne IP-Adresse, ohne Geräte-Kennung und ohne Nutzerprofil. Die Redaktion kann jede Messung einzeln abschalten; Rohdaten werden nach der eingestellten Frist gelöscht.'] },
					{ h: 'Schriften und Medien', p: ['Schriften, Bilder und Videos werden von unserem eigenen Server geladen. Es werden keine Inhalte von Drittanbietern eingebunden.'] },
					{ h: 'Hinweis', p: ['Der vollständige Datenschutztext wird im Echtbetrieb vom FBN bereitgestellt.'] }
				]
			},
			en: {
				title: 'Privacy',
				intro: 'Nutztierkosmos works without cookies, without accounts and without third-party tracking services.',
				sections: [
					{ h: 'What is stored on your device', p: ['Technically necessary: your chosen language.', 'Only with your consent: the researcher pass (exhibitions read, quiz results). It stays on your device and can be deleted at any time under “Get involved”.'] },
					{ h: 'Usage statistics', p: ['We only count page views, popular topics, search terms and quiz results as totals – without IP address, device ID or user profile. The editorial team can switch off each measurement individually; raw data is deleted after the configured period.'] },
					{ h: 'Fonts and media', p: ['Fonts, images and videos are loaded from our own server. No third-party content is embedded.'] },
					{ h: 'Note', p: ['The full privacy policy will be provided by FBN in production.'] }
				]
			}
		},
		impressum: {
			de: {
				title: 'Impressum',
				intro: 'Forschungsinstitut für Nutztierbiologie (FBN), Wilhelm-Stahl-Allee 2, 18196 Dummerstorf.',
				sections: [{ h: 'Hinweis', p: ['Platzhalter – die vollständigen Angaben werden im Echtbetrieb vom FBN gepflegt.'] }]
			},
			en: {
				title: 'Legal notice',
				intro: 'Research Institute for Farm Animal Biology (FBN), Wilhelm-Stahl-Allee 2, 18196 Dummerstorf, Germany.',
				sections: [{ h: 'Note', p: ['Placeholder – full details will be maintained by FBN in production.'] }]
			}
		}
	};

	let info = $derived(pages[slug]?.[i18n.active]);
</script>

<svelte:head><title>{info?.title ?? t('common.notFound')} · Nutztierkosmos</title></svelte:head>

<div class="wrap max-w-3xl space-y-8 py-8 sm:py-12">
	{#if info}
		<Breadcrumbs items={[{ label: info.title }]} />
		<header class="space-y-3">
			<h1 class="display">{info.title}</h1>
			<p class="lead">{info.intro}</p>
		</header>
		{#each info.sections as section (section.h)}
			<section class="space-y-3">
				<h2 class="h3">{section.h}</h2>
				{#if section.p.length > 1}
					<ul class="list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-ink-700">
						{#each section.p as p (p)}<li>{p}</li>{/each}
					</ul>
				{:else}
					<p class="text-[16px] leading-relaxed text-ink-700">{section.p[0]}</p>
				{/if}
			</section>
		{/each}
	{:else}
		<h1 class="h2">{t('common.notFound')}</h1>
		<a class="b1" href="/">{t('common.toHome')}</a>
	{/if}
</div>
