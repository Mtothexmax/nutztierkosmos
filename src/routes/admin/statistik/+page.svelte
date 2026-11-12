<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { StatsConfig } from '$lib/types';

	showReqs(['stats', 'stats-config', 'privacy']);

	let canConfigure = $derived(session.can('stats.configure'));
	let days = $derived(Object.entries(content.stats.daily).sort(([a], [b]) => a.localeCompare(b)).slice(-30));
	let total = $derived(days.reduce((s, [, v]) => s + v, 0));
	let maxDay = $derived(Math.max(1, ...days.map(([, v]) => v)));
	let topExhibitions = $derived(
		Object.entries(content.stats.exhibitions)
			.map(([id, v]) => ({ id, v, title: content.getExhibition(id)?.title.de ?? id }))
			.sort((a, b) => b.v - a.v)
			.slice(0, 6)
	);
	let maxEx = $derived(Math.max(1, ...topExhibitions.map((x) => x.v)));
	let quizRows = $derived(
		Object.keys(content.stats.quizStarts).map((id) => {
			const starts = content.stats.quizStarts[id] ?? 0;
			const done = content.stats.quizCompletions[id] ?? 0;
			const score = content.stats.quizScore[id];
			return { id, title: content.getQuiz(id)?.title.de ?? id, starts, done, rate: starts ? done / starts : 0, avg: score?.n ? score.sum / score.n : null };
		})
	);
	let searches = $derived(Object.entries(content.stats.searches).sort((a, b) => b[1] - a[1]).slice(0, 10));
	let dwell = $derived(
		Object.entries(content.stats.dwell).map(([id, d]) => ({ title: content.getExhibition(id)?.title.de ?? id, avg: d.n ? d.sum / d.n : 0 }))
	);

	const points = (list: [string, number][]) =>
		list.map(([, v], i) => `${(i / Math.max(1, list.length - 1)) * 100},${40 - (v / maxDay) * 36}`).join(' ');

	const options: { key: keyof Omit<StatsConfig, 'retentionDays'>; label: string; what: string }[] = [
		{ key: 'pageviews', label: 'Seitenaufrufe', what: 'Zähler je Tag. Keine IP, keine Geräte-Kennung.' },
		{ key: 'topics', label: 'Beliebte Themen', what: 'Zähler je Ausstellung und Kategorie.' },
		{ key: 'interactions', label: 'Nutzung von Quiz und Spielen', what: 'Zähler für Starts und Abschlüsse.' },
		{ key: 'successRates', label: 'Erfolgsquoten', what: 'Summe der erreichten Prozentwerte je Quiz – ohne Bezug zu Personen.' },
		{ key: 'searchTerms', label: 'Suchbegriffe', what: 'Begriffe ab 3 Zeichen, gekürzt auf 40 Zeichen. Achtung: Freitext kann Personenbezug enthalten.' },
		{ key: 'dwellTime', label: 'Verweildauer', what: 'Durchschnittliche Lesezeit je Ausstellung, begrenzt auf 30 Minuten. Standardmäßig aus.' }
	];

	function saveConfig() {
		content.persistStats();
		content.log(session.user!.id, 'Statistik-Konfiguration geändert', options.filter((o) => content.statsConfig[o.key]).map((o) => o.label).join(', '), 'security');
		toasts.push('Konfiguration gespeichert und protokolliert');
	}
</script>

<svelte:head><title>Statistik · Redaktion</title></svelte:head>

<div>
	<h1 class="h1">Nutzungsstatistik</h1>
	<p class="max-w-2xl text-ink-500">Datensparsam: nur aggregierte Zähler, keine Cookies, keine personenbezogenen Daten. Demo-Zahlen plus Ihre Klicks in dieser Sitzung.</p>
</div>

<div class="grid gap-4 md:grid-cols-3">
	<div class="card !p-5">
		<p class="text-[13px] text-ink-500">Seitenaufrufe, letzte 30 Tage</p>
		<p class="font-serif text-[34px] font-semibold">{total.toLocaleString('de-DE')}</p>
		<svg viewBox="0 0 100 40" class="mt-2 h-16 w-full" preserveAspectRatio="none" role="img" aria-label="Verlauf der Seitenaufrufe über 30 Tage">
			<polygon points="0,40 {points(days)} 100,40" fill="#e5e9ee" />
			<polyline points={points(days)} fill="none" stroke="#002555" stroke-width="1.2" vector-effect="non-scaling-stroke" />
		</svg>
	</div>
	<div class="card !p-5">
		<p class="text-[13px] text-ink-500">Quiz-Abschlüsse</p>
		<p class="font-serif text-[34px] font-semibold">{quizRows.reduce((s, r) => s + r.done, 0).toLocaleString('de-DE')}</p>
		<p class="text-[13px] text-ink-500">von {quizRows.reduce((s, r) => s + r.starts, 0).toLocaleString('de-DE')} Starts</p>
	</div>
	<div class="card !p-5">
		<p class="text-[13px] text-ink-500">Ø Erfolgsquote</p>
		{#if content.statsConfig.successRates}
			{@const rated = quizRows.filter((r) => r.avg !== null)}
			<p class="font-serif text-[34px] font-semibold">{rated.length ? Math.round((rated.reduce((s, r) => s + (r.avg ?? 0), 0) / rated.length) * 100) : 0} %</p>
			<p class="text-[13px] text-ink-500">über alle Quizze</p>
		{:else}
			<p class="pt-3 text-ink-500">deaktiviert</p>
		{/if}
	</div>
</div>

<div class="grid gap-6 xl:grid-cols-2">
	<section class="card space-y-3" aria-labelledby="top-ex">
		<h2 id="top-ex" class="font-serif text-lg font-semibold">Beliebte Ausstellungen</h2>
		<ul class="space-y-2.5">
			{#each topExhibitions as row (row.id)}
				<li class="grid grid-cols-[minmax(0,12rem)_1fr_3.5rem] items-center gap-3 text-[14px]">
					<span class="truncate">{row.title}</span>
					<span class="h-3 rounded-full bg-sand-100"><span class="block h-3 rounded-full bg-brand-500" style:width="{(row.v / maxEx) * 100}%"></span></span>
					<span class="text-right tabular-nums">{row.v.toLocaleString('de-DE')}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="card space-y-3" aria-labelledby="search-terms">
		<h2 id="search-terms" class="font-serif text-lg font-semibold">Häufige Suchbegriffe</h2>
		{#if content.statsConfig.searchTerms}
			<ul class="flex flex-wrap gap-2">
				{#each searches as [term, n] (term)}<li class="chip">{term} <span class="text-ink-500">{n}</span></li>{/each}
			</ul>
		{:else}
			<p class="text-ink-500">Erfassung deaktiviert.</p>
		{/if}
		{#if dwell.length}
			<h3 class="pt-3 font-semibold">Ø Verweildauer</h3>
			<ul class="text-[14px]">{#each dwell as d (d.title)}<li>{d.title}: {Math.round(d.avg)} s</li>{/each}</ul>
		{/if}
	</section>
</div>

<section class="card overflow-x-auto" aria-labelledby="quiz-stats">
	<h2 id="quiz-stats" class="mb-3 font-serif text-lg font-semibold">Quiz und Lernmodule</h2>
	<table class="w-full min-w-[560px]">
		<thead><tr><th>Quiz</th><th class="!text-right">Starts</th><th class="!text-right">Abschlüsse</th><th class="!text-right">Abschlussrate</th><th class="!text-right">Ø Ergebnis</th></tr></thead>
		<tbody>
			{#each quizRows as r (r.id)}
				<tr>
					<td>{r.title}</td>
					<td class="text-right tabular-nums">{r.starts}</td>
					<td class="text-right tabular-nums">{r.done}</td>
					<td class="text-right tabular-nums">{Math.round(r.rate * 100)} %</td>
					<td class="text-right tabular-nums">{r.avg === null || !content.statsConfig.successRates ? '–' : `${Math.round(r.avg * 100)} %`}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<section class="card space-y-4" aria-labelledby="config">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 id="config" class="font-serif text-lg font-semibold">Aktivierte Auswertungen und Datenschutz-Konfiguration</h2>
		{#if !canConfigure}<span class="bdg !bg-sand-100 !text-ink-700"><Icon name="lock" size={16} />Nur Administration kann ändern</span>{/if}
	</div>
	<ul class="divide-y divide-sand-200">
		{#each options as o (o.key)}
			<li class="flex items-start gap-3 py-3">
				<input id="cfg-{o.key}" type="checkbox" class="mt-1 h-4 w-4" bind:checked={content.statsConfig[o.key]} disabled={!canConfigure} />
				<label for="cfg-{o.key}" class="flex-1">
					<span class="block font-medium">{o.label} <span class="ml-1 text-[12px] font-semibold {content.statsConfig[o.key] ? 'text-brand-700' : 'text-ink-500'}">{content.statsConfig[o.key] ? 'aktiv' : 'aus'}</span></span>
					<span class="block text-[13px] text-ink-500">{o.what}</span>
				</label>
			</li>
		{/each}
	</ul>
	<div class="flex flex-wrap items-end gap-3">
		<div>
			<label class="lbl" for="cfg-ret">Aufbewahrung der Tageswerte</label>
			<select id="cfg-ret" class="inp !w-auto" bind:value={content.statsConfig.retentionDays} disabled={!canConfigure}>
				{#each [30, 90, 180, 365] as d (d)}<option value={d}>{d} Tage</option>{/each}
			</select>
		</div>
		{#if canConfigure}<button class="b1" onclick={saveConfig}><Icon name="save" size={20} />Konfiguration speichern</button>{/if}
	</div>
	<p class="rounded-xl bg-sand-50 p-3 text-[13px] text-ink-700">
		<strong>Technik:</strong> Zählung serverseitig bzw. cookielos (z. B. Matomo ohne Cookies, IP-Anonymisierung, kein Fingerprinting). Weil keine Daten auf dem Endgerät gespeichert und keine Personen wiedererkannt werden, ist keine Einwilligung nötig. Jede Änderung dieser Einstellungen wird im Protokoll festgehalten.
	</p>
</section>
