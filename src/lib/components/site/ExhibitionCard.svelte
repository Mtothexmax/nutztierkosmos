<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { pass } from '$lib/stores/pass.svelte';
	import type { Exhibition } from '$lib/types';

	let { exhibition, headingLevel = 3, large = false }: { exhibition: Exhibition; headingLevel?: 2 | 3; large?: boolean } = $props();

	let topic = $derived(content.getTopic(exhibition.topicId));
	let category = $derived(content.getCategory(topic?.categoryId));
	let hero = $derived(content.getMedia(exhibition.heroMediaId));
	let read = $derived(pass.hasRead(exhibition.id));
</script>

<article class="tile group relative flex h-full flex-col overflow-hidden">
	<div class="media-frame aspect-[16/9] !rounded-none">
		{#if hero}
			<img src={hero.src} alt="" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" width="1600" height="900" />
		{/if}
		{#if read}
			<span class="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-brand-700">
				<Icon name="check_circle" size={16} filled />{t('exh.read')}
			</span>
		{/if}
	</div>
	<div class="flex flex-1 flex-col gap-2 p-5 {large ? 'sm:p-7' : ''}">
		<p class="eyebrow">
			{tr(category?.title)} · <span lang={i18n.langOf(topic?.title)}>{tr(topic?.title)}</span>
		</p>
		<svelte:element this={`h${headingLevel}`} class="{large ? 'h2' : 'h3'}" lang={i18n.langOf(exhibition.title)}>
			<a href="/ausstellung/{exhibition.slug}" class="after:absolute after:inset-0 focus-visible:outline-none">
				{tr(exhibition.title)}
			</a>
		</svelte:element>
		<p class="line-clamp-3 text-[15px] text-ink-700" lang={i18n.langOf(exhibition.teaser)}>{tr(exhibition.teaser)}</p>
		<p class="mt-auto flex items-center gap-3 pt-2 text-[13px] text-ink-500">
			<span class="inline-flex items-center gap-1"><Icon name="schedule" size={16} />{t('exh.minutes', { n: exhibition.readingMinutes })}</span>
			{#if i18n.missing(exhibition.title) || i18n.missing(exhibition.teaser)}
				<span class="inline-flex items-center gap-1"><Icon name="translate" size={16} />{t('lang.missingShort')}</span>
			{/if}
		</p>
	</div>
</article>

<style>
	article:focus-within {
		outline: 3px solid var(--color-brand-500);
		outline-offset: 2px;
	}
</style>
