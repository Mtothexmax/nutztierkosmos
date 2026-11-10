<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Breadcrumbs from '$lib/components/site/Breadcrumbs.svelte';
	import { i18n, t, tr, type UiKey } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content, type SearchQuery, type SearchType } from '$lib/stores/content.svelte';
	import type { Audience } from '$lib/types';

	showReqs(['search', 'filter', 'sort', 'mobile-filter', 'i18n-context', 'a11y']);

	// Der Zustand steckt in der URL – teilbar, und beim Sprachwechsel bleibt alles erhalten.
	const params = page.url.searchParams;
	let q = $state(params.get('q') ?? '');
	let categoryId = $state(params.get('tier') ?? '');
	let fieldId = $state(params.get('gebiet') ?? '');
	let type = $state<SearchType | ''>((params.get('typ') ?? params.get('type') ?? '') as SearchType | '');
	let keywordId = $state(params.get('schlagwort') ?? '');
	let audience = $state<Audience | ''>((params.get('zielgruppe') ?? '') as Audience | '');
	let sort = $state<SearchQuery['sort']>((params.get('sort') as SearchQuery['sort']) ?? 'relevance');
	let filtersOpen = $state(false);
	let submitted = $state(params.get('q') ?? '');

	let results = $derived(
		content.search({
			q: submitted,
			categoryId: categoryId || undefined,
			fieldId: fieldId || undefined,
			type: type || undefined,
			keywordId: keywordId || undefined,
			audience: audience || undefined,
			sort
		})
	);

	let activeFilters = $derived([categoryId, fieldId, type, keywordId, audience].filter(Boolean).length);

	$effect(() => {
		const sp = new URLSearchParams();
		if (submitted) sp.set('q', submitted);
		if (categoryId) sp.set('tier', categoryId);
		if (fieldId) sp.set('gebiet', fieldId);
		if (type) sp.set('typ', type);
		if (keywordId) sp.set('schlagwort', keywordId);
		if (audience) sp.set('zielgruppe', audience);
		if (sort !== 'relevance') sp.set('sort', sort);
		const next = `/suche${sp.size ? `?${sp}` : ''}`;
		if (next !== location.pathname + location.search) replaceState(next, {});
	});

	onMount(() => {
		if (submitted) content.trackSearch(submitted);
	});

	function submit(event: SubmitEvent) {
		event.preventDefault();
		submitted = q.trim();
		content.trackSearch(submitted);
	}

	function reset() {
		categoryId = fieldId = keywordId = '';
		type = '';
		audience = '';
	}

	const typeLabel: Record<SearchType, UiKey> = {
		exhibition: 'search.typeExhibition',
		publication: 'search.typePublication',
		quiz: 'search.typeQuiz'
	};
	const typeIcon: Record<SearchType, string> = { exhibition: 'museum', publication: 'article', quiz: 'quiz' };
	const audiences: Audience[] = ['allgemein', 'schule', 'studium', 'presse'];

</script>

<svelte:head><title>{t('search.title')}{submitted ? `: ${submitted}` : ''} · Nutztierkosmos</title></svelte:head>

<div class="wrap space-y-8 py-8 sm:py-12">
	<Breadcrumbs items={[{ label: t('search.title') }]} />
	<h1 class="display">{t('search.title')}</h1>

	<form role="search" onsubmit={submit} class="max-w-3xl">
		<label for="search-q" class="mb-2 block text-[15px] font-semibold">{t('search.label')}</label>
		<div class="flex gap-2">
			<div class="relative flex-1">
				<Icon name="search" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-500" />
				<input id="search-q" type="search" class="inp !h-12 !pl-11 !text-[16px]" bind:value={q} placeholder={t('home.searchPlaceholder')} autocomplete="off" />
			</div>
			<button type="submit" class="b1 !h-12">{t('search.submit')}</button>
		</div>
	</form>

	<div class="grid gap-8 lg:grid-cols-[17rem_1fr]">
		<div>
			<button
				type="button"
				class="b2 w-full justify-between lg:hidden"
				aria-expanded={filtersOpen}
				aria-controls="search-filters"
				onclick={() => (filtersOpen = !filtersOpen)}
			>
				<span class="inline-flex items-center gap-2"><Icon name="tune" />{t('search.showFilters')}{activeFilters ? ` (${activeFilters})` : ''}</span>
				<Icon name={filtersOpen ? 'expand_less' : 'expand_more'} />
			</button>

			<section id="search-filters" aria-label={t('search.filters')} class="mt-3 space-y-5 rounded-2xl border border-sand-200 bg-white p-5 lg:mt-0 lg:block {filtersOpen ? 'block' : 'hidden'}">
				<div>
					<label class="lbl" for="f-tier">{t('search.animal')}</label>
					<select id="f-tier" class="inp" bind:value={categoryId}>
						<option value="">{t('search.all')}</option>
						{#each content.activeCategories() as c (c.id)}<option value={c.id}>{tr(c.title)}</option>{/each}
					</select>
				</div>
				<div>
					<label class="lbl" for="f-gebiet">{t('search.field')}</label>
					<select id="f-gebiet" class="inp" bind:value={fieldId}>
						<option value="">{t('search.all')}</option>
						{#each content.fields as f (f.id)}<option value={f.id}>{tr(f.title)}</option>{/each}
					</select>
				</div>
				<div>
					<label class="lbl" for="f-typ">{t('search.type')}</label>
					<select id="f-typ" class="inp" bind:value={type}>
						<option value="">{t('search.all')}</option>
						<option value="exhibition">{t('search.typeExhibition')}</option>
						<option value="publication">{t('search.typePublication')}</option>
						{#if content.settings.gamification}<option value="quiz">{t('search.typeQuiz')}</option>{/if}
					</select>
				</div>
				<div>
					<label class="lbl" for="f-kw">{t('search.keyword')}</label>
					<select id="f-kw" class="inp" bind:value={keywordId}>
						<option value="">{t('search.all')}</option>
						{#each [...content.keywords].sort((a, b) => tr(a.label).localeCompare(tr(b.label))) as k (k.id)}<option value={k.id}>{tr(k.label)}</option>{/each}
					</select>
				</div>
				<fieldset>
					<legend class="lbl">{t('home.audiencesTitle')}</legend>
					<div class="flex flex-wrap gap-2">
						{#each audiences as a (a)}
							<button type="button" class="chip" aria-pressed={audience === a} onclick={() => (audience = audience === a ? '' : a)}>{t(`audience.${a}` as UiKey)}</button>
						{/each}
					</div>
				</fieldset>
				{#if activeFilters}
					<button type="button" class="b3 w-full" onclick={reset}><Icon name="filter_alt_off" size={20} />{t('search.reset')}</button>
				{/if}
			</section>
		</div>

		<section aria-labelledby="results-heading" class="min-w-0">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<h2 id="results-heading" class="text-[16px] font-semibold" aria-live="polite">
					{results.length === 1 ? t('search.results1') : t('search.results', { n: results.length })}
				</h2>
				<div class="flex items-center gap-2">
					<label for="f-sort" class="text-[14px] text-ink-500">{t('search.sort')}</label>
					<select id="f-sort" class="inp !w-auto !py-2" bind:value={sort}>
						<option value="relevance">{t('search.sortRelevance')}</option>
						<option value="date">{t('search.sortDate')}</option>
						<option value="title">{t('search.sortTitle')}</option>
					</select>
				</div>
			</div>

			{#if results.length}
				<ul class="space-y-3">
					{#each results as hit (hit.type + hit.id)}
						{@const image = content.getMedia(hit.mediaId)}
						<li>
							<article class="tile relative flex gap-4 p-4 sm:p-5">
								{#if image}
									<span class="hidden h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-sand-100 sm:block">
										<img src={image.src} alt="" class="h-full w-full object-cover" width="144" height="96" loading="lazy" />
									</span>
								{:else}
									<span class="hidden h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 sm:grid"><Icon name={typeIcon[hit.type]} /></span>
								{/if}
								<div class="min-w-0 flex-1">
									<p class="mb-1 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-500">
										<span class="inline-flex items-center gap-1 font-semibold text-brand-700"><Icon name={typeIcon[hit.type]} size={16} />{t(typeLabel[hit.type])}</span>
										<span aria-hidden="true">·</span>
										<span>{tr(content.getCategory(hit.categoryId)?.title)}</span>
										<span aria-hidden="true">·</span>
										<time datetime={hit.date}>{i18n.date(hit.date)}</time>
									</p>
									<h3 class="h3 !text-[18px]" lang={hit.titleLang}>
										<a href={hit.href} class="after:absolute after:inset-0 hover:text-brand-700">{hit.title}</a>
									</h3>
									<p class="mt-1 line-clamp-2 text-[14px] text-ink-700">{hit.text}</p>
								</div>
							</article>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-ink-500">{t('search.none')}</p>
			{/if}

			<p class="mt-6 flex items-start gap-2 text-[13px] text-ink-500"><Icon name="info" size={18} />{t('search.logic')}</p>
		</section>
	</div>
</div>
