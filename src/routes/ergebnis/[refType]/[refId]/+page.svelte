<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { i18n } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { read, storageKeys } from '$lib/storage/db';
	import { content } from '$lib/stores/content.svelte';
	import { pass } from '$lib/stores/pass.svelte';
	import type { LastResult } from '$lib/types';
	import { formatDuration } from '$lib/utils';

	showReqs(['feedback', 'gamification', 'privacy']);

	let refType = $derived((page.params.refType ?? 'quiz') as 'quiz' | 'game');
	let refId = $derived(page.params.refId ?? '');
	const stored = read<LastResult | null>(storageKeys.lastResult, null);
	let result = $derived(stored && stored.refId === refId && stored.refType === refType ? stored : null);

	let quiz = $derived(refType === 'quiz' ? content.getQuiz(refId) : undefined);
	let en = $derived(quiz ? quiz.lang === 'en' : i18n.active === 'en');
	const L = (de: string, english: string) => (en ? english : de);

	let quote = $derived(result ? Math.round((result.points / Math.max(1, result.maxPoints)) * 100) : 0);
	let retryHref = $derived(refType === 'quiz' ? `/quiz/${refId}` : `/spielen/${refId}`);
	let exhibition = $derived(content.exhibitionWith(refType === 'quiz' ? { quizId: refId } : { gameId: refId }));
	let backHref = $derived(exhibition && content.isPublic(exhibition) ? `/ausstellung/${exhibition.slug}` : '/mitmachen');

	let message = $derived(
		quote >= 80
			? L('Ausgezeichnet!', 'Excellent!')
			: quote >= 50
				? L('Gut gemacht!', 'Well done!')
				: L('Ein guter Anfang!', 'A good start!')
	);
</script>

<svelte:head><title>{L('Ergebnis', 'Result')} · Nutztierkosmos</title></svelte:head>

<main class="grid min-h-screen place-items-center bg-sand-100 p-4" lang={en ? 'en' : 'de'}>
	{#if !result}
		<div class="card w-full max-w-xl space-y-4 text-center">
			<h1 class="h1">{L('Kein Ergebnis gefunden', 'No result found')}</h1>
			<p class="text-ink-500">{L('Starten Sie zuerst ein Quiz oder ein Spiel.', 'Start a quiz or a game first.')}</p>
			<a class="b1" href="/mitmachen">{L('Zu den Quizzen', 'To the quizzes')}</a>
		</div>
	{:else}
		<div class="card w-full max-w-xl space-y-5 text-center">
			<p class="ovl">{result.title}</p>
			<div
				class="mx-auto grid h-[140px] w-[140px] place-items-center rounded-full"
				style="background:conic-gradient(#002555 {quote}%, #CCD3DD 0)"
				role="img"
				aria-label="{quote} %"
			>
				<div class="grid h-[116px] w-[116px] place-items-center rounded-full bg-white">
					<div>
						<div class="font-serif text-[40px] leading-none font-bold">{quote} %</div>
						<div class="text-[13px] text-ink-500">{result.points} / {result.maxPoints} {L('Punkte', 'points')}</div>
					</div>
				</div>
			</div>

			<h1 class="h1">{message}</h1>
			{#if result.total > 0}
				<p class="text-ink-700">
					{L(`Sie haben ${result.correct} von ${result.total} Fragen richtig beantwortet.`, `You answered ${result.correct} of ${result.total} questions correctly.`)}
				</p>
			{/if}

			<div class="grid grid-cols-3 gap-3 text-[14px]">
				<div class="rounded-xl bg-ok-bg p-3">
					<b class="font-serif text-2xl">{result.total ? result.correct : '–'}</b><br />{L('Richtig', 'Correct')}
				</div>
				<div class="rounded-xl bg-err-bg p-3">
					<b class="font-serif text-2xl">{result.total ? result.total - result.correct : '–'}</b><br />{L('Falsch', 'Wrong')}
				</div>
				<div class="rounded-xl bg-sand-100 p-3">
					<b class="font-serif text-2xl">{formatDuration(result.durationMs)}</b><br />{L('Zeit', 'Time')}
				</div>
			</div>

			{#if content.settings.gamification}
				<p class="rounded-xl bg-brand-50 p-3 text-[14px] text-ink-700">
					<Icon name="badge" size={18} class="text-brand-700" />
					{#if pass.enabled}
						{L('Im Forscherpass auf diesem Gerät gespeichert.', 'Saved to the researcher pass on this device.')}
						<a class="link" href="/mitmachen">{L('Abzeichen ansehen', 'View badges')}</a>
					{:else}
						{L('Nicht gespeichert. Mit dem freiwilligen Forscherpass sammeln Sie Abzeichen – nur auf Ihrem Gerät.', 'Not saved. With the optional researcher pass you can collect badges – on your device only.')}
						<a class="link" href="/mitmachen">{L('Mehr dazu', 'Learn more')}</a>
					{/if}
				</p>
			{/if}

			<div class="flex flex-wrap justify-center gap-2">
				<a class="b1" href={retryHref}><Icon name="replay" size={20} />{L('Nochmal', 'Try again')}</a>
				<a class="b2" href={backHref}>{exhibition ? L('Zurück zur Ausstellung', 'Back to the exhibition') : L('Weitere Quizze', 'More quizzes')}</a>
			</div>
		</div>
	{/if}
</main>
