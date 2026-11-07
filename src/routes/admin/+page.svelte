<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { formatDateTime } from '$lib/utils';

	let kpis = $derived([
		{ label: 'Module', value: content.modules.length, trend: '+0', icon: 'category' },
		{ label: 'Quizze', value: content.quizzes.length, trend: '+1 diese Woche', icon: 'quiz' },
		{ label: 'HTML-Spiele', value: content.games.length, trend: '+0', icon: 'sports_esports' },
		{ label: 'Spieler', value: content.players.length, trend: '+2 diese Woche', icon: 'group' }
	]);

	let recent = $derived(content.recentItems());
</script>

<svelte:head><title>CMS · Nutztierkosmos</title></svelte:head>

<div>
	<h1 class="h1">Willkommen zurück</h1>
	<p class="text-ink-500">Stand: 6. November 2026 · Demo-Daten</p>
</div>

<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
	{#each kpis as kpi (kpi.label)}
		<div class="card !p-4">
			<Icon name={kpi.icon} class="text-brand-600" />
			<div class="font-serif text-[40px] leading-none font-bold">{kpi.value}</div>
			<div class="text-[13px] text-ink-500">{kpi.label} · {kpi.trend}</div>
			<svg viewBox="0 0 60 16" class="mt-2 h-4 w-full" aria-hidden="true">
				<polyline
					fill="none"
					stroke="#8DBF3F"
					stroke-width="2"
					points="0,14 12,10 24,12 36,6 48,8 60,2"
				/>
			</svg>
		</div>
	{/each}
</div>

<div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
	<div class="card overflow-x-auto !p-0">
		<h2 class="p-5 font-serif text-xl font-semibold text-brand-700">Zuletzt bearbeitet</h2>
		<table class="w-full min-w-[560px]">
			<thead>
				<tr>
					<th scope="col">Titel</th>
					<th scope="col">Typ</th>
					<th scope="col">Geändert</th>
					<th scope="col">Von</th>
					<th scope="col"><span class="sr-only">Aktion</span></th>
				</tr>
			</thead>
			<tbody>
				{#each recent as item (item.id + item.type)}
					<tr class="hover:bg-brand-50/50">
						<td>{item.title}</td>
						<td><span class="bdg">{item.type}</span></td>
						<td>{formatDateTime(item.updatedAt)}</td>
						<td>Redaktion</td>
						<td><a class="text-brand-500" href={item.href}>Bearbeiten</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="card space-y-3">
		<h2 class="font-serif text-xl font-semibold text-brand-700">Schnellaktionen</h2>
		<a class="b2 w-full justify-start" href="/admin/spiele?new=1">
			<Icon name="add_circle" />Neues Spiel oder Quiz
		</a>
		<a class="b2 w-full justify-start" href="/admin/spiele">
			<Icon name="sports_esports" />Alle Spiele
		</a>
	</div>
</div>

<div class="rounded-2xl bg-brand-50 p-4 text-ink-700">
	<b>Hinweis:</b> Diese Demo speichert alle Inhalte ausschließlich im Browser (localStorage).
</div>
