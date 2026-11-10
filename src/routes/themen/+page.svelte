<script lang="ts">
	import { withBase } from '$lib/paths';
	import Icon from '$lib/components/Icon.svelte';
	import Breadcrumbs from '$lib/components/site/Breadcrumbs.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';

	showReqs(['hierarchy', 'categories', 'cms-nocode', 'i18n', 'responsive']);
	content.trackPage({});
</script>

<svelte:head><title>{t('topics.title')} · Nutztierkosmos</title></svelte:head>

<div class="wrap space-y-10 py-8 sm:py-12">
	<Breadcrumbs items={[{ label: t('topics.title') }]} />
	<header class="max-w-2xl space-y-3">
		<h1 class="display">{t('topics.title')}</h1>
		<p class="lead">{t('topics.intro')}</p>
	</header>

	{#each content.activeCategories() as category (category.id)}
		{@const topics = content.topicsOf(category.id)}
		{@const image = content.getMedia(category.imageId)}
		<section class="grid gap-6 rounded-3xl border border-sand-200 bg-white p-5 sm:p-7 lg:grid-cols-[18rem_1fr]" aria-labelledby="cat-{category.id}">
			<div class="space-y-3">
				<div class="media-frame aspect-[4/3]">
					{#if image}<img src={withBase(image.src)} alt="" class="h-full w-full object-cover" width="400" height="300" />{/if}
				</div>
				<h2 id="cat-{category.id}" class="h2" lang={i18n.langOf(category.title)}>
					<a class="hover:text-brand-700" href="/themen/{category.slug}">{tr(category.title)}</a>
				</h2>
				<p class="text-[15px] text-ink-700" lang={i18n.langOf(category.description)}>{tr(category.description)}</p>
			</div>
			<div>
				<h3 class="mb-3 text-[13px] font-semibold tracking-wide text-ink-500 uppercase">{t('topics.focus')}</h3>
				<ul class="divide-y divide-sand-200">
					{#each topics as topic (topic.id)}
						{@const count = content.exhibitionsOfTopic(topic.id).length}
						<li>
							<a href="/themen/{category.slug}/{topic.slug}" class="group flex items-center gap-4 py-4">
								<span class="min-w-0 flex-1">
									<span class="block font-semibold text-ink-900 group-hover:text-brand-700" lang={i18n.langOf(topic.title)}>{tr(topic.title)}</span>
									<span class="block text-[14px] text-ink-500" lang={i18n.langOf(topic.description)}>{tr(topic.description)}</span>
								</span>
								<span class="shrink-0 text-[13px] text-ink-500">{count === 1 ? t('topics.exhibitions1') : t('topics.exhibitions', { n: count })}</span>
								<Icon name="chevron_right" class="shrink-0 text-brand-600" />
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{/each}
</div>
