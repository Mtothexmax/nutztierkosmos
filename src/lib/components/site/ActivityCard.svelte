<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { pass } from '$lib/stores/pass.svelte';
	import type { Activity } from '$lib/types';

	/**
	 * Quiz und Spiel gleichrangig dargestellt. Die Art steht nur als kleines Etikett;
	 * Aufbau, Größe und Gewicht sind für beide gleich.
	 * - variant "card": Karte in Listen (Mitmachen, Themenseite)
	 * - variant "feature": hervorgehobener Kasten in einer Ausstellung
	 */
	type Props = {
		activity: Activity;
		variant?: 'card' | 'feature';
		headingLevel?: 2 | 3 | 4;
		/** Einordnung über dem Titel: keine, nur Thema oder Kategorie · Thema. */
		context?: 'none' | 'topic' | 'full';
		/** Link zur Ausstellung anbieten, in der das Angebot eingebunden ist. */
		showExhibition?: boolean;
	};
	let { activity, variant = 'card', headingLevel = 3, context = 'none', showExhibition = false }: Props = $props();

	let item = $derived(activity.item);
	let lang = $derived(activity.lang);
	let topic = $derived(content.getTopic(item.topicId));
	let category = $derived(content.getCategory(topic?.categoryId));
	let best = $derived(pass.best(item.id));
	let exhibition = $derived(
		showExhibition
			? activity.kind === 'quiz'
				? content.exhibitionWith({ quizId: item.id })
				: content.exhibitionWith({ gameId: item.id })
			: undefined
	);
	let meta = $derived(
		activity.kind === 'quiz' ? t('exh.questions', { n: activity.item.questions.length }) : t('act.gameMeta')
	);
	let kindLabel = $derived(activity.kind === 'quiz' ? t('act.quiz') : t('act.game'));
	let kindIcon = $derived(activity.kind === 'quiz' ? 'quiz' : 'sports_esports');
	let startLabel = $derived(activity.kind === 'quiz' ? t('exh.startQuiz') : t('exh.startGame'));
</script>

{#if variant === 'feature'}
	<section class="relative overflow-hidden rounded-3xl bg-brand-900 p-6 text-white sm:p-8">
		<div class="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-brand-600/40" aria-hidden="true"></div>
		<div class="relative flex flex-wrap items-center gap-6">
			<div class="min-w-0 flex-1 space-y-2">
				<p class="flex items-center gap-2 text-[12px] font-semibold tracking-[0.12em] text-lime-500 uppercase">
					<Icon name={kindIcon} size={18} />{kindLabel} · {t('exh.testKnowledge')}
				</p>
				<svelte:element this={`h${headingLevel}`} class="font-serif text-[24px] font-semibold" {lang}>{activity.title}</svelte:element>
				<p class="text-white/85" {lang}>{activity.description}</p>
				<p class="text-[13px] text-white/70">
					{meta} · {t('exh.optional')}
					{#if lang !== i18n.active} · {t('lang.missingShort')}{/if}
					{#if best !== undefined} · {t('part.best', { p: Math.round(best * 100) })}{/if}
				</p>
			</div>
			<a class="btn bg-white text-brand-900 hover:bg-brand-50" href={activity.href}><Icon name="play_arrow" />{startLabel}</a>
		</div>
	</section>
{:else}
	<article class="tile flex h-full flex-col gap-3 p-5">
		<div class="flex flex-wrap items-center gap-2">
			<span class="bdg"><Icon name={kindIcon} size={16} />{kindLabel}</span>
			{#if context === 'full'}
				<span class="eyebrow">{tr(category?.title)} · {tr(topic?.title)}</span>
			{:else if context === 'topic'}
				<span class="eyebrow">{tr(topic?.title)}</span>
			{/if}
		</div>
		<svelte:element this={`h${headingLevel}`} class="h3" {lang}>{activity.title}</svelte:element>
		<p class="text-[15px] text-ink-700" {lang}>{activity.description}</p>
		<p class="text-[13px] text-ink-500">
			{meta}
			{#if lang !== i18n.active} · {t('lang.missingShort')}{/if}
			{#if best !== undefined} · {t('part.best', { p: Math.round(best * 100) })}{/if}
		</p>
		<div class="mt-auto flex flex-wrap gap-2 pt-2">
			<a class="b1" href={activity.href}><Icon name="play_arrow" size={20} />{startLabel}</a>
			{#if exhibition && content.isPublic(exhibition)}
				<a class="b3" href="/ausstellung/{exhibition.slug}">{t('part.toExhibition')}</a>
			{/if}
		</div>
	</article>
{/if}
