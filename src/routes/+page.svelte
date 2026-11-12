<script lang="ts">
	import { withBase } from '$lib/paths';
	import { goto } from '$lib/paths';
	import Icon from '$lib/components/Icon.svelte';
	import ExhibitionCard from '$lib/components/site/ExhibitionCard.svelte';
	import { i18n, t, tr, type UiKey } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import type { Audience } from '$lib/types';

	showReqs(['browser', 'audiences', 'hierarchy', 'search', 'gamification', 'design', 'responsive', 'i18n', 'a11y', 'privacy']);
	content.trackPage({});

	let q = $state('');
	let exhibitions = $derived(content.publicExhibitions());
	let featured = $derived(exhibitions[0]);
	let latest = $derived(exhibitions.slice(1, 4));
	let quizCount = $derived(content.quizzes.filter((x) => x.published).length);
	let publicationCount = $derived(
		new Set(exhibitions.flatMap((e) => e.publicationIds)).size
	);
	let popular = $derived(
		Object.entries(content.stats.searches)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([term]) => term)
	);

	const audiences: { id: Audience; icon: string }[] = [
		{ id: 'allgemein', icon: 'diversity_3' },
		{ id: 'schule', icon: 'school' },
		{ id: 'studium', icon: 'science' },
		{ id: 'presse', icon: 'newspaper' }
	];

	function submit(event: SubmitEvent) {
		event.preventDefault();
		goto(`/suche?q=${encodeURIComponent(q.trim())}`);
	}
</script>

<svelte:head>
	<title>Nutztierkosmos – {t('site.tagline')}</title>
	<meta name="description" content={tr(content.settings.subtitle)} />
</svelte:head>

<section class="border-b border-sand-200 bg-gradient-to-b from-white to-sand-50">
	<div class="wrap grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
		<div class="space-y-6">
			<p class="eyebrow">Forschungsinstitut für Nutztierbiologie (FBN)</p>
			<h1 class="display">{t('home.title')}</h1>
			<p class="lead max-w-xl">{tr(content.settings.subtitle)}</p>

			<form role="search" class="max-w-xl" onsubmit={submit}>
				<label for="home-search" class="mb-2 block text-[15px] font-semibold text-ink-900">{t('home.searchLabel')}</label>
				<div class="flex gap-2">
					<div class="relative flex-1">
						<Icon name="search" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-500" />
						<input id="home-search" type="search" class="inp !h-12 !pl-11 !text-[16px]" placeholder={t('home.searchPlaceholder')} bind:value={q} autocomplete="off" />
					</div>
					<button class="b1 !h-12 !px-5" type="submit">{t('search.submit')}</button>
				</div>
			</form>

			{#if popular.length}
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-[13px] text-ink-500">{t('home.popular')}:</span>
					{#each popular as term (term)}
						<a class="chip" href="/suche?q={encodeURIComponent(term)}">{term}</a>
					{/each}
				</div>
			{/if}

			<p class="text-[14px] text-ink-500">
				{t('home.stats', { n: exhibitions.length, p: publicationCount, q: quizCount })}
			</p>
		</div>

		{#if featured}
			<div>
				<ExhibitionCard exhibition={featured} headingLevel={2} large />
			</div>
		{/if}
	</div>
</section>

<section class="wrap py-14" aria-labelledby="by-animal">
	<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
		<h2 id="by-animal" class="h2">{t('home.byAnimal')}</h2>
		<a class="link text-[15px]" href="/themen">{t('nav.topics')} →</a>
	</div>
	<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each content.activeCategories() as category (category.id)}
			{@const count = content.exhibitionsOfCategory(category.id).length}
			{@const image = content.getMedia(category.imageId)}
			<li>
				<a href="/themen/{category.slug}" class="tile flex items-center gap-4 overflow-hidden p-3 pr-5">
					<span class="block h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-100">
						{#if image}<img src={withBase(image.src)} alt="" class="h-full w-full object-cover" width="96" height="80" />{/if}
					</span>
					<span class="min-w-0">
						<span class="block font-serif text-[20px] font-semibold text-ink-900" lang={i18n.langOf(category.title)}>{tr(category.title)}</span>
						<span class="block text-[14px] text-ink-500">
							{count === 1 ? t('topics.exhibitions1') : t('topics.exhibitions', { n: count })} · {content.topicsOf(category.id).length} {t('topics.focus')}
						</span>
					</span>
					<Icon name="arrow_forward" class="ml-auto text-brand-600" />
				</a>
			</li>
		{/each}
	</ul>
</section>

{#if latest.length}
	<section class="border-y border-sand-200 bg-white py-14" aria-labelledby="latest">
		<div class="wrap">
			<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
				<h2 id="latest" class="h2">{t('home.latest')}</h2>
				<a class="link text-[15px]" href="/suche?sort=date&type=exhibition">{t('home.allExhibitions')} →</a>
			</div>
			<ul class="grid gap-5 md:grid-cols-3">
				{#each latest as exhibition (exhibition.id)}
					<li><ExhibitionCard {exhibition} /></li>
				{/each}
			</ul>
		</div>
	</section>
{/if}

<section class="wrap py-14" aria-labelledby="audiences">
	<h2 id="audiences" class="h2 mb-6">{t('home.audiencesTitle')}</h2>
	<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each audiences as a (a.id)}
			<li>
				<a href="/suche?zielgruppe={a.id}" class="tile flex h-full flex-col gap-2 p-5">
					<span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={a.icon} /></span>
					<span class="font-semibold text-ink-900">{t(`audience.${a.id}` as UiKey)}</span>
					<span class="text-[14px] text-ink-500">{t(`audience.${a.id}.text` as UiKey)}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>

{#if content.settings.gamification}
	<section class="wrap" aria-labelledby="participate">
		<div class="relative overflow-hidden rounded-3xl bg-brand-900 p-8 text-white sm:p-10">
			<div class="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-brand-600/40" aria-hidden="true"></div>
			<div class="absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-lime-500/20" aria-hidden="true"></div>
			<div class="relative grid items-center gap-6 md:grid-cols-[1.4fr_auto]">
				<div class="space-y-3">
					<h2 id="participate" class="font-serif text-[26px] font-semibold sm:text-[30px]">{t('home.participateTitle')}</h2>
					<p class="max-w-xl text-white/85">{t('home.participateText')}</p>
				</div>
				<a href="/mitmachen" class="btn bg-white text-brand-900 hover:bg-brand-50">
					<Icon name="extension" />{t('home.participateCta')}
				</a>
			</div>
		</div>
	</section>
{/if}
