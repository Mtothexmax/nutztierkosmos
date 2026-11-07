<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { read, storageKeys } from '$lib/storage/db';
	import type { LastResult } from '$lib/types';
	import { formatDuration } from '$lib/utils';

	let refType = $derived((page.params.refType ?? 'quiz') as 'quiz' | 'game');
	let refId = $derived(page.params.refId ?? '');

	let stored = read<LastResult | null>(storageKeys.lastResult, null);
	let result = $derived.by<LastResult | null>(() => {
		if (stored && stored.refId === refId && stored.refType === refType) return stored;
		if (!session.player) return null;
		const best = content.scores
			.filter((s) => s.playerId === session.player?.id && s.refId === refId)
			.sort((a, b) => b.points - a.points)[0];
		if (!best) return null;
		const title =
			refType === 'quiz' ? content.getQuiz(refId)?.title : content.getGame(refId)?.title;
		return {
			refType,
			refId,
			title: title ?? 'Ergebnis',
			points: best.points,
			maxPoints: best.maxPoints,
			correct: 0,
			total: 0,
			durationMs: best.durationMs,
			at: best.at
		};
	});

	let quote = $derived(
		result ? Math.round((result.points / Math.max(1, result.maxPoints)) * 100) : 0
	);
	let targetHref = $derived(
		result ? (result.refType === 'quiz' ? `/quiz/${result.refId}` : `/spielen/${result.refId}`) : '/lernen'
	);
	let backHref = $derived(
		refType === 'quiz'
			? `/lernen/${content.getQuiz(refId)?.moduleId ?? ''}`
			: `/lernen/${content.getGame(refId)?.moduleId ?? ''}`
	);
	let badges = $derived(
		result
			? [
					{ icon: '🏅', label: 'Methan-Profi', unlocked: quote >= 60 },
					{ icon: '⚡', label: 'Schnelldenker', unlocked: quote >= 80 },
					{ icon: '🔥', label: 'Serie 3', unlocked: quote >= 95 }
				]
			: []
	);
</script>

<svelte:head><title>Ergebnis · Nutztierkosmos</title></svelte:head>

<main class="grid min-h-screen place-items-center bg-sand-100 p-4">
	{#if !result}
		<div class="card w-full max-w-xl space-y-4 text-center">
			<h1 class="h1">Kein Ergebnis gefunden</h1>
			<p class="text-ink-500">Spiele zuerst ein Quiz oder ein Spiel.</p>
			<a class="b1" href="/lernen">Zu den Modulen</a>
		</div>
	{:else}
		<div class="card w-full max-w-xl space-y-4 text-center">
			<p class="ovl">{result.title}</p>
			<div class="mx-auto grid h-[140px] w-[140px] place-items-center rounded-full"
				style="background:conic-gradient(#8DBF3F {quote}%, #E7E0CE 0)"
			>
				<div class="grid h-[116px] w-[116px] place-items-center rounded-full bg-white">
					<div>
						<div class="font-serif text-[40px] leading-none font-bold">{result.points}</div>
						<div class="text-[13px] text-ink-500">von {result.maxPoints} Punkten</div>
					</div>
				</div>
			</div>

			<h1 class="h1">Stark, {session.player?.name ?? 'du'}!</h1>
			{#if result.total > 0}
				<p class="text-ink-500">
					Du hast {result.correct} von {result.total} Fragen richtig beantwortet.
				</p>
			{:else}
				<p class="text-ink-500">Dein Ergebnis wurde gespeichert.</p>
			{/if}

			<div class="grid grid-cols-3 gap-3">
				<div class="rounded-xl bg-ok-bg p-3">
					<b class="font-serif text-2xl">{result.correct || '–'}</b><br />Richtig
				</div>
				<div class="rounded-xl bg-err-bg p-3">
					<b class="font-serif text-2xl"
						>{result.total ? result.total - result.correct : '–'}</b
					><br />Falsch
				</div>
				<div class="rounded-xl bg-sand-100 p-3">
					<b class="font-serif text-2xl">{formatDuration(result.durationMs)}</b><br />Zeit
				</div>
			</div>

			<div class="flex justify-center gap-4 text-3xl">
				{#each badges as badge (badge.label)}
					<span
						title={badge.label}
						class={badge.unlocked ? '' : 'opacity-40 grayscale'}
						aria-label="{badge.label} {badge.unlocked ? 'freigeschaltet' : 'gesperrt'}"
					>
						{badge.icon}
					</span>
				{/each}
			</div>

			<div class="flex flex-wrap justify-center gap-2">
				<a class="b1" href={targetHref}>Nochmal spielen</a>
				<a class="b2" href={backHref}>Zurück zum Modul</a>
				<a class="b3" href="/lernen"><Icon name="leaderboard" size={18} /> Bestenliste</a>
			</div>
		</div>
	{/if}
</main>
