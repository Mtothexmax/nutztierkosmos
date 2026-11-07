<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import PlayerHeader from '$lib/components/PlayerHeader.svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import type { Module, ModuleColor } from '$lib/types';

	onMount(() => {
		if (!session.isLoggedIn) goto('/');
	});

	type Filter = 'alle' | 'neu' | 'angefangen' | 'abgeschlossen';
	let filter = $state<Filter>('alle');

	const moduleColors: Record<ModuleColor, string> = {
		forest: 'bg-brand-100',
		amber: 'bg-amber-500/20',
		sky: 'bg-sky-500/20',
		berry: 'bg-berry-500/20'
	};

	let modules = $derived([...content.modules].filter((m) => m.published).sort((a, b) => a.order - b.order));

	function progressOf(module: Module): number {
		return session.player ? content.moduleProgress(module.id, session.player.id) : 0;
	}

	function stationsOf(module: Module): number {
		return content.quizzesForModule(module.id).length + content.gamesForModule(module.id).length;
	}

	function statusOf(module: Module): { label: string; tone: string } {
		if (stationsOf(module) === 0)
			return { label: 'Bald verfügbar', tone: '!bg-sand-100 !text-ink-500' };
		const p = progressOf(module);
		if (p >= 100) return { label: 'Abgeschlossen', tone: '!bg-lime-500/20 !text-brand-700' };
		if (p > 0) return { label: 'Angefangen', tone: '' };
		return { label: 'Neu', tone: '!bg-sand-100 !text-ink-700' };
	}

	let nextModule = $derived(
		modules.find((m) => progressOf(m) > 0 && progressOf(m) < 100) ??
			modules.find((m) => stationsOf(m) > 0) ??
			modules[0]
	);

	let filtered = $derived(
		modules.filter((module) => {
			const p = progressOf(module);
			if (filter === 'neu') return p === 0;
			if (filter === 'angefangen') return p > 0 && p < 100;
			if (filter === 'abgeschlossen') return p >= 100;
			return true;
		})
	);

	let stationCount = $derived(
		modules.reduce(
			(sum, m) =>
				sum + content.quizzesForModule(m.id).length + content.gamesForModule(m.id).length,
			0
		)
	);

	let playable = $derived(modules.filter((m) => stationsOf(m) > 0));

	let overall = $derived(
		playable.length
			? Math.round(playable.reduce((sum, m) => sum + progressOf(m), 0) / playable.length)
			: 0
	);

	let leaderboard = $derived(content.leaderboard().slice(0, 6));
	let points = $derived(session.player ? content.pointsOf(session.player.id) : 0);
	let level = $derived(session.player ? content.levelOf(session.player.id) : 'Einsteiger');

	const filters: { id: Filter; label: string }[] = [
		{ id: 'alle', label: 'Alle' },
		{ id: 'neu', label: 'Neu' },
		{ id: 'angefangen', label: 'Angefangen' },
		{ id: 'abgeschlossen', label: 'Abgeschlossen' }
	];
</script>

<svelte:head><title>Lernen · Nutztierkosmos</title></svelte:head>

<PlayerHeader />

<main class="mx-auto max-w-5xl space-y-8 p-4 lg:p-8">
	<div
		class="relative grid items-center gap-6 overflow-hidden rounded-2xl bg-brand-900 p-8 text-white md:grid-cols-[1fr_auto]"
	>
		<div class="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-brand-600/40"></div>
		<div class="relative space-y-3">
			<p class="ovl !text-white/60">Dein Fortschritt</p>
			<h1 class="font-serif text-[34px] font-bold">Weiter so, {session.player?.name ?? 'du'}!</h1>
			<p class="text-white/80">
				{playable.filter((m) => progressOf(m) > 0).length} von {playable.length} Modulen begonnen ·
				Level „{level}"
			</p>
			<div class="flex flex-wrap gap-2 pt-2">
				<a class="btn bg-white text-brand-900" href="/lernen/{nextModule?.id ?? ''}">Weiterlernen</a>
				<a class="btn border border-white/60 text-white" href="#bestenliste">Bestenliste ansehen</a>
			</div>
		</div>
		<div class="relative">
			<ProgressRing value={overall} />
		</div>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3">
		<h2 class="font-serif text-2xl font-semibold text-brand-700">Deine Module</h2>
		<div class="flex flex-wrap gap-2">
			{#each filters as option (option.id)}
				<button
					class="bdg transition {filter === option.id
						? '!bg-brand-600 !text-white'
						: '!bg-sand-100 !text-ink-700 hover:!bg-sand-200'}"
					onclick={() => (filter = option.id)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		{#each filtered as module (module.id)}
			{@const p = progressOf(module)}
			{@const status = statusOf(module)}
			{@const stations = stationsOf(module)}
			<a
				href="/lernen/{module.id}"
				class="card block transition hover:-translate-y-0.5 hover:shadow-lg"
				class:!bg-sand-50={stations === 0}
				class:border-dashed={stations === 0}
			>
				<div class="flex justify-between">
					<span class="grid h-14 w-14 place-items-center rounded-xl text-3xl {moduleColors[module.color]}">
						{module.emoji}
					</span>
					<span class="bdg h-fit {status.tone}">{status.label}</span>
				</div>
				<h3 class="mt-3 text-[17px] font-semibold">{module.title}</h3>
				<p class="text-[13px] text-ink-500">
					{stations} {stations === 1 ? 'Station' : 'Stationen'} · {module.description}
				</p>
				<div class="my-3 h-2 rounded-full bg-sand-200">
					<div class="h-2 rounded-full bg-lime-500" style:width="{p}%"></div>
				</div>
				<span class="flex items-center gap-1 font-medium text-brand-600">
					{stations === 0 ? 'Bald verfügbar' : p ? 'Weiter' : 'Starten'}
					{#if stations > 0}<Icon name="chevron_right" size={18} />{/if}
				</span>
			</a>
		{/each}
	</div>

	{#if filtered.length === 0}
		<div class="card py-12 text-center text-ink-500">Keine Module in dieser Auswahl.</div>
	{/if}

	<div class="card" id="bestenliste">
		<div class="mb-3 flex justify-between">
			<h2 class="font-serif text-2xl font-semibold text-brand-700">Bestenliste</h2>
			<span class="font-medium text-brand-500">Top {leaderboard.length}</span>
		</div>
		<div class="divide-y divide-sand-200">
			{#each leaderboard as entry, index (entry.player.id)}
				<div
					class="flex items-center gap-3 py-2 {entry.player.id === session.player?.id
						? '-mx-2 rounded-lg bg-lime-500/15 px-2'
						: ''}"
				>
					<b class="w-6">{index + 1}</b>
					<span class="text-xl">{entry.player.avatar}</span>
					<span class="flex-1 font-medium">
						{entry.player.name}
						{#if entry.player.id === session.player?.id}<span class="bdg">Du</span>{/if}
						{#if entry.player.name === 'Frau Weber'}<span class="bdg">Lehrkraft</span>{/if}
						<br /><small class="text-ink-500">{content.levelOf(entry.player.id)}</small>
					</span>
					<b>{entry.points}</b>
				</div>
			{/each}
		</div>
	</div>

	<footer class="text-[13px] text-ink-500">
		Ein Demo-Projekt · FBN-Forschung zum Anfassen · {stationCount} Stationen · {points} Punkte
	</footer>
</main>
