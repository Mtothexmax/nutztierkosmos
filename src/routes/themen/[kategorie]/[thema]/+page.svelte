<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Breadcrumbs from '$lib/components/site/Breadcrumbs.svelte';
	import ExhibitionCard from '$lib/components/site/ExhibitionCard.svelte';
	import LangNotice from '$lib/components/site/LangNotice.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';

	showReqs(['hierarchy', 'exhibitions', 'gamification', 'i18n-context']);

	let category = $derived(content.getCategoryBySlug(page.params.kategorie ?? ''));
	let topic = $derived(
		category ? content.topicsOf(category.id).find((x) => x.slug === page.params.thema) : undefined
	);
	let exhibitions = $derived(topic ? content.exhibitionsOfTopic(topic.id) : []);
	let quizzes = $derived(
		topic && content.settings.gamification
			? content
					.quizzesForTopic(topic.id)
					.filter((q) => !q.translationOf)
					.map((q) => content.quizForLocale(q.id, i18n.active) ?? q)
			: []
	);

	onMount(() => {
		if (category) content.trackPage({ categoryId: category.id });
	});
</script>

<svelte:head><title>{tr(topic?.title)} · Nutztierkosmos</title></svelte:head>

{#if !category || !topic}
	<div class="wrap py-20 text-center">
		<h1 class="h2">{t('common.notFound')}</h1>
		<a class="b1 mt-6" href="/themen">{t('topics.title')}</a>
	</div>
{:else}
	<div class="wrap space-y-10 py-8 sm:py-12">
		<Breadcrumbs
			items={[
				{ href: '/themen', label: t('topics.title') },
				{ href: `/themen/${category.slug}`, label: tr(category.title) },
				{ label: tr(topic.title) }
			]}
		/>
		<header class="max-w-3xl space-y-3">
			<p class="eyebrow">{tr(category.title)} · {tr(content.getField(topic.fieldId)?.title)}</p>
			<h1 class="display" lang={i18n.langOf(topic.title)}>{tr(topic.title)}</h1>
			<p class="lead" lang={i18n.langOf(topic.description)}>{tr(topic.description)}</p>
			<LangNotice values={[topic.title, topic.description]} />
		</header>

		{#if exhibitions.length}
			<ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each exhibitions as exhibition (exhibition.id)}
					<li><ExhibitionCard {exhibition} headingLevel={2} /></li>
				{/each}
			</ul>
		{:else}
			<p class="rounded-2xl border border-dashed border-sand-200 p-6 text-[15px] text-ink-500">{t('topics.none')}</p>
		{/if}

		{#if quizzes.length}
			<section aria-labelledby="topic-quizzes" class="rounded-3xl bg-brand-50 p-6 sm:p-8">
				<h2 id="topic-quizzes" class="h3 mb-1">{t('exh.testKnowledge')}</h2>
				<p class="mb-4 text-[14px] text-ink-700">{t('exh.optional')}</p>
				<ul class="flex flex-wrap gap-3">
					{#each quizzes as quiz (quiz.id)}
						<li>
							<a class="b2" href="/quiz/{quiz.id}" lang={quiz.lang ?? 'de'}><Icon name="quiz" size={20} />{quiz.title}</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
{/if}
