<script lang="ts">
	import { withBase } from '$lib/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Breadcrumbs from '$lib/components/site/Breadcrumbs.svelte';
	import ExhibitionCard from '$lib/components/site/ExhibitionCard.svelte';
	import LangNotice from '$lib/components/site/LangNotice.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';

	showReqs(['hierarchy', 'categories', 'filter', 'i18n-context', 'responsive']);

	let category = $derived(content.getCategoryBySlug(page.params.kategorie ?? ''));
	let topics = $derived(category ? content.topicsOf(category.id) : []);
	let image = $derived(content.getMedia(category?.imageId));

	onMount(() => {
		if (category) content.trackPage({ categoryId: category.id });
	});
</script>

<svelte:head><title>{tr(category?.title)} · Nutztierkosmos</title></svelte:head>

{#if !category || !category.active}
	<div class="wrap py-20 text-center">
		<h1 class="h2">{t('common.notFound')}</h1>
		<a class="b1 mt-6" href="/themen">{t('topics.title')}</a>
	</div>
{:else}
	<section class="border-b border-sand-200 bg-white">
		<div class="wrap grid items-center gap-8 py-8 sm:py-12 md:grid-cols-[1.3fr_1fr]">
			<div class="space-y-4">
				<Breadcrumbs items={[{ href: '/themen', label: t('topics.title') }, { label: tr(category.title) }]} />
				<h1 class="display" lang={i18n.langOf(category.title)}>{tr(category.title)}</h1>
				<p class="lead" lang={i18n.langOf(category.description)}>{tr(category.description)}</p>
				<LangNotice values={[category.title, category.description]} />
				<a class="link text-[15px]" href="/suche?tier={category.id}"><Icon name="search" size={18} /> {t('nav.search')}: {tr(category.title)}</a>
			</div>
			<div class="media-frame aspect-[4/3] max-md:hidden">
				{#if image}<img src={withBase(image.src)} alt="" class="h-full w-full object-cover" width="800" height="600" />{/if}
			</div>
		</div>
	</section>

	<div class="wrap space-y-14 py-12">
		{#each topics as topic (topic.id)}
			{@const exhibitions = content.exhibitionsOfTopic(topic.id)}
			<section aria-labelledby="topic-{topic.id}" class="space-y-5">
				<div class="flex flex-wrap items-end justify-between gap-3">
					<div>
						<p class="eyebrow">{tr(content.getField(topic.fieldId)?.title)}</p>
						<h2 id="topic-{topic.id}" class="h2" lang={i18n.langOf(topic.title)}>
							<a class="hover:text-brand-700" href="/themen/{category.slug}/{topic.slug}">{tr(topic.title)}</a>
						</h2>
						<p class="mt-1 text-[15px] text-ink-700" lang={i18n.langOf(topic.description)}>{tr(topic.description)}</p>
					</div>
				</div>
				{#if exhibitions.length}
					<ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{#each exhibitions as exhibition (exhibition.id)}
							<li><ExhibitionCard {exhibition} /></li>
						{/each}
					</ul>
				{:else}
					<p class="rounded-2xl border border-dashed border-sand-200 p-6 text-[15px] text-ink-500">{t('topics.none')}</p>
				{/if}
			</section>
		{/each}
	</div>
{/if}
